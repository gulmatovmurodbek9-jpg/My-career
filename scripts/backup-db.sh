#!/usr/bin/env bash
# Нусхаи эҳтиётии ҳаррӯзаи база (cron, 03:30). 14 рӯзи охир нигоҳ дошта мешавад.
#
#   Насб (як бор, дар сервер):
#     ( crontab -l 2>/dev/null; echo "30 3 * * * bash /root/My-career/scripts/backup-db.sh >> /var/log/mycareer-backup.log 2>&1" ) | crontab -
#
#   Санҷиши барқароркунӣ (нусхаи охиринро ба базаи муваққатӣ мекушояд ва мешуморад):
#     bash /root/My-career/scripts/backup-db.sh --verify
set -euo pipefail

API_DIR=/root/My-career/Back/nest-backend
DEST=/root/backups/daily
KEEP_DAYS=14

set -a
# shellcheck disable=SC1090
. <(grep -E '^DB_(HOST|PORT|USERNAME|USER|PASSWORD|NAME|DATABASE)=' "$API_DIR/.env" | tr -d '\r')
set +a
export PGPASSWORD="$DB_PASSWORD"
HOST="${DB_HOST:-localhost}"
USER_NAME="${DB_USERNAME:-${DB_USER:-postgres}}"
DB="${DB_NAME:-${DB_DATABASE:-career_db}}"

mkdir -p "$DEST"

if [ "${1:-}" = "--verify" ]; then
  LATEST=$(ls -1t "$DEST"/db-*.sql.gz | head -1)
  TMP=restore_check_$(date +%s)
  echo "барқароркунии $LATEST → $TMP"
  createdb -h "$HOST" -U "$USER_NAME" "$TMP"
  trap 'dropdb -h "$HOST" -U "$USER_NAME" "$TMP"' EXIT
  gunzip -c "$LATEST" | psql -q -h "$HOST" -U "$USER_NAME" -d "$TMP" -v ON_ERROR_STOP=1 >/dev/null
  psql -h "$HOST" -U "$USER_NAME" -d "$TMP" -At -c \
    "SELECT 'users=' || count(*) FROM \"user\" UNION ALL SELECT 'careers=' || count(*) FROM career UNION ALL SELECT 'universities=' || count(*) FROM universities"
  echo "OK — нусха кушода шуд"
  exit 0
fi

FILE="$DEST/db-$(date +%Y%m%d-%H%M).sql.gz"
nice -n 15 pg_dump -h "$HOST" -U "$USER_NAME" "$DB" | gzip > "$FILE.part"
mv "$FILE.part" "$FILE"
find "$DEST" -name 'db-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "$(date '+%F %T') нусха: $FILE ($(du -h "$FILE" | cut -f1))"
