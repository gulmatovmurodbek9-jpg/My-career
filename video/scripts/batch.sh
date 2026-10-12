#!/bin/bash
# Ҳамаи видеоҳо: барои ҳар видео — сабти компютер ва телефон (3 забон), баъд рендер.
# Аз нав оғоз кардан бехатар аст: корҳои тайёр (баъди SINCE) такрор намешаванд.
cd "$(dirname "$0")/.."
export TEMP=D:/tmp TMP=D:/tmp SINCE="${SINCE:-2026-10-10T20:20:00+05:00}"
for id in 00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16; do
  node scripts/livevideo.mjs $id --skip-done 2>&1 | grep -E "✓|✗"
  node scripts/livevideo.mjs $id --mobile --skip-done 2>&1 | grep -E "✓|✗"
  node scripts/livevideo.mjs --render $id --skip-done 2>&1 | grep -E "✓|✗|Error" | grep -v bringToFront
  node scripts/livevideo.mjs --render $id --mobile --skip-done 2>&1 | grep -E "✓|✗|Error" | grep -v bringToFront
  echo "== $id тамом"
done
echo "BATCH DONE"
