#!/usr/bin/env bash
# Сенарияҳои «Як рӯз дар ихтисос»-ро аз компютер ба сервер интиқол медиҳад (аз рӯи рамзи ихтисос).
#   bash scripts/sync-trials.sh
# Ҳар сенария дар сервер аз нав санҷида мешавад; такрор зарар намерасонад.
set -euo pipefail
cd "$(dirname "$0")/../Back/nest-backend"
KEY="${KEY:-$HOME/.ssh/mycareer_deploy}"
HOST="${HOST:-root@31.222.229.253}"
FILE="trials-export.json"
npm run --silent trials:export -- "$FILE"
scp -i "$KEY" -q "$FILE" "$HOST:/root/My-career/Back/nest-backend/$FILE"
ssh -i "$KEY" "$HOST" "cd /root/My-career/Back/nest-backend && npm run --silent trials:import -- $FILE && rm -f $FILE"
rm -f "$FILE"
