#!/bin/bash
# Сабтҳои кӯҳна (yuvj420p, бо B-frame) Remotion-ро вайрон мекунанд — аз нав рамзгузорӣ.
cd "$(dirname "$0")/.."
F=node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe
P=node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe
for f in public/v/*/*/live*.mp4; do
  case "$f" in *.orig.mp4) continue;; esac
  pf=$($P -v error -select_streams v -show_entries stream=pix_fmt -of csv=p=0 "$f")
  case "$pf" in yuvj420p*) ;; *) continue;; esac
  t=$(stat -c %Y "$f")
  "$F" -y -loglevel error -i "$f" -vf scale=in_range=pc:out_range=tv -pix_fmt yuv420p -c:v libx264 -crf 18 -g 15 -bf 0 -movflags +faststart "$f.tmp.mp4" && mv "$f.tmp.mp4" "$f" && touch -d @$t "$f" && echo "fixed $f"
done
