#!/usr/bin/env bash
#
# Polls GitHub once a minute and deploys origin/main when it moves.
#
# Installed to /usr/local/bin/mycareer-autodeploy by scripts/install-autodeploy.sh
# and driven by mycareer-autodeploy.timer. Deliberately lives OUTSIDE the repo:
# deploy-server.sh hard-resets the working tree, and bash reads a script
# incrementally, so a poller running from inside the repo could be rewritten
# underneath itself mid-run.
#
# Harmless to leave enabled alongside GitHub Actions: whichever deploys first
# moves HEAD to origin/main, and the other then finds nothing to do.
#
#   journalctl -u mycareer-autodeploy -f     # watch it work

set -euo pipefail
export LANG=C.UTF-8 LC_ALL=C.UTF-8
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

REPO=/root/My-career
BRANCH=main

git -C "$REPO" fetch --prune --quiet origin

LOCAL=$(git -C "$REPO" rev-parse HEAD)
REMOTE=$(git -C "$REPO" rev-parse "origin/$BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

echo "new commit on origin/$BRANCH: ${REMOTE:0:8} (was ${LOCAL:0:8}) — deploying"

# Run the deploy script from the commit being deployed, not the one on disk,
# exactly as the GitHub Actions job does by piping it over ssh.
TMP=$(mktemp /tmp/mycareer-deploy.XXXXXX)
trap 'rm -f "$TMP"' EXIT
git -C "$REPO" show "origin/$BRANCH:scripts/deploy-server.sh" > "$TMP"

bash "$TMP" "$REMOTE" --with-frontend
