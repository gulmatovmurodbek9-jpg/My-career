# Видеоҳои омӯзишӣ (Remotion)

17 видео × 3 забон (tj / ru / en). Ҳама чиз бо скрипт сохта мешавад — агар сайт тағйир ёбад, аз нав сабт кунед.

Пеш аз оғоз: backend (`localhost:3005`, бо овоз) ва frontend (`localhost:5173`) бояд кор кунанд.
Ҳисобҳои намоишӣ дар **базаи маҳаллӣ** худкор сохта мешаванд (`scripts/setup.mjs`).

```
npm install
node scripts/capture.mjs [00 02 ...] [--lang tj]   # скриншотҳо → public/v/<id>/<lang>/
node scripts/voice.mjs   [00 02 ...] [--lang tj]   # садо (/api/voice/speak) ва давомнокӣ
node scripts/render.mjs  [00 02 ...] [--lang tj]   # out/<id>-<lang>.mp4 ва .jpg (муқова)
node scripts/stills.mjs 00 tj 5 12                 # санҷиши чанд кадр
```

- Сенарияҳо ва матни садо: `scripts/videos.mjs` (ниг. `docs/naqshaho/SENARIYAI-VIDEOHOI-OMUZISHI.md`).
- Қолаби видео: `src/Tutorial.tsx` (муқаддима → саҳнаҳо бо курсор, зум ва зерсарлавҳа → охир).
- Дар сервер: файлҳо дар `/var/www/ikhtisosiman/videos/`; сайт онҳоро дар `/help` ва тугмаи «▶ Чӣ тавр кор мекунад?» нишон медиҳад.
- Диски C: пур бошад: лоиҳаро дар D: нигоҳ доред ва `TEMP=D:\tmp` гузоред.
