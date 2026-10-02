#!/usr/bin/env bash
# Моделҳои овози русӣ (Piper Dmitri) ва англисӣ (Kokoro) → voice-models/
# Истифода (дар сервер, аз папкаи Back/nest-backend):
#   bash scripts/download-tts-models.sh
# Кушодан бо python3 — дар сервер bzip2 нест. Приоритети паст (nice), то сайт суст нашавад.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p voice-models
cd voice-models

BASE="https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models"
for name in vits-piper-ru_RU-dmitri-medium kokoro-multi-lang-v1_0; do
  if [ -d "$name" ]; then
    echo "$name — аллакай ҳаст"
    continue
  fi
  echo "$name — зеркашӣ…"
  curl -fsSL -o "$name.tar.bz2" "$BASE/$name.tar.bz2"
  nice -n 19 python3 -c "import sys, tarfile; tarfile.open(sys.argv[1]).extractall('.')" "$name.tar.bz2"
  rm -f "$name.tar.bz2"
  echo "$name — тайёр"
done
du -sh ./*/
