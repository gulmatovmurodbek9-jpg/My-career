#!/usr/bin/env bash
#
# Deploy My Career on the production server (62.238.33.236).
#
# GitHub Actions pipes this file over ssh, so the version that runs is always
# the one from the commit being deployed:
#
#     ssh root@server "bash -s -- <sha>" < scripts/deploy-server.sh
#
# Manual use on the server:
#
#     bash /root/My-career/scripts/deploy-server.sh origin/main --with-frontend
#     bash /root/My-career/scripts/deploy-server.sh origin/main --seed   # DESTRUCTIVE
#
# CI builds the frontend on the runner and rsyncs dist/ itself, so --with-frontend
# is only needed when deploying by hand (the box has 2 GB of RAM — a local vite
# build is slow and close to the memory ceiling).
#
# If the API fails to come back healthy the previous commit is rebuilt and
# restarted, so a broken push cannot leave the site down.

set -euo pipefail
export LANG=C.UTF-8 LC_ALL=C.UTF-8
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

REPO=/root/My-career
API_DIR="$REPO/Back/nest-backend"
FRONT_DIR="$REPO/Front"
WEBROOT=/var/www/ikhtisosiman
SERVICE=mycareer-api
HEALTH_URL=http://127.0.0.1:3005/api/clusters

TARGET="${1:?usage: deploy-server.sh <commit-sha-or-ref> [--with-frontend] [--seed]}"
shift
WITH_FRONTEND=0
SEED=0
for arg in "$@"; do
  case "$arg" in
    --with-frontend) WITH_FRONTEND=1 ;;
    --seed)          SEED=1 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

log() { printf '\n==> %s\n' "$*"; }

lock_hash() { sha256sum "$1" 2>/dev/null | cut -d' ' -f1; }

# npm ci is reproducible but hard-fails when the lockfile drifts out of sync
# with package.json; fall back so a deploy is never blocked by that alone.
install_deps() {
  npm ci --no-audit --no-fund || {
    echo "npm ci failed, falling back to npm install" >&2
    npm install --no-audit --no-fund
  }
}

build_backend() {
  cd "$API_DIR"
  install_deps
  npm run build
}

wait_for_health() {
  for _ in $(seq 1 25); do
    # stderr silenced: the first few attempts fail by design while nest boots
    if curl -fsS --max-time 5 -o /dev/null "$HEALTH_URL" 2>/dev/null; then
      return 0
    fi
    sleep 2
  done
  return 1
}

# ─────────────────────────────── deploy ────────────────────────────────

PREV_SHA=$(git -C "$REPO" rev-parse HEAD)
log "current commit: $PREV_SHA"

log "fetching $TARGET"
git -C "$REPO" fetch --prune origin
# Untracked/ignored files (.env, uploads/) survive a hard reset, so this is the
# safe way to make the server match the commit exactly even after a hotfix.
git -C "$REPO" reset --hard "$TARGET"
NEW_SHA=$(git -C "$REPO" rev-parse HEAD)
log "deploying commit: $NEW_SHA"

if [ "$PREV_SHA" = "$NEW_SHA" ]; then
  log "already at this commit — rebuilding anyway"
fi

log "backend: install + build"
build_backend

if [ "$SEED" -eq 1 ]; then
  log "reseeding database (destructive)"
  cd "$API_DIR" && npm run seed
fi

log "restarting $SERVICE"
systemctl restart "$SERVICE"

if wait_for_health; then
  log "API healthy"
else
  echo "!!! API did not become healthy — rolling back to $PREV_SHA" >&2
  journalctl -u "$SERVICE" -n 40 --no-pager >&2 || true
  git -C "$REPO" reset --hard "$PREV_SHA"
  build_backend
  systemctl restart "$SERVICE"
  if wait_for_health; then
    echo "rollback succeeded — server is back on $PREV_SHA" >&2
  else
    echo "!!! rollback ALSO failed — the API is down, manual action required" >&2
  fi
  exit 1
fi

if [ "$WITH_FRONTEND" -eq 1 ]; then
  log "frontend: install + build"
  cd "$FRONT_DIR"
  install_deps
  NODE_OPTIONS="--max-old-space-size=1536" npm run build

  log "publishing frontend to $WEBROOT"
  rsync -a --delete "$FRONT_DIR/dist/" "$WEBROOT/"
  chown -R www-data:www-data "$WEBROOT"
fi

log "done — deployed $NEW_SHA"
curl -s -o /dev/null -w "    https://ikhtisosiman.qobus.tj -> HTTP %{http_code}\n" \
  --resolve ikhtisosiman.qobus.tj:443:127.0.0.1 https://ikhtisosiman.qobus.tj/
