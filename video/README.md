# Видеоҳои омӯзишӣ (Remotion)

17 видео × 3 забон (tj / ru / en). Ҳама чиз бо скрипт сохта мешавад — агар сайт тағйир ёбад, аз нав сабт кунед.

Пеш аз оғоз: backend (`localhost:3005`, бо овоз) ва frontend (`localhost:5173`) бояд кор кунанд.
Ҳисобҳои намоишӣ дар **базаи маҳаллӣ** худкор сохта мешаванд (`scripts/setup.mjs`).

**Тарзи асосӣ — видеои зинда** (сабти воқеии экран бо овози модел, барои компютер ва телефон):

```
npm install
node scripts/livevideo.mjs 06 --lang tj            # сабт → public/v/06/tj/live.mp4 + manifest-live.json
node scripts/livevideo.mjs 06 --lang tj --mobile   # телефон (iPhone 13) → live-m.mp4
node scripts/livevideo.mjs --render 06 [--mobile]  # out/live/06-tj[-m].mp4 ва .jpg
bash scripts/batch.sh                               # ҳамаи 17 видео × 3 забон × 2 дастгоҳ (аз ҷои қатъшуда давом медиҳад)
```

- Ҳар саҳна: `hint` (дастури зард дар боло), `target` + `action` (`click` / `type` / `point`) ё `focus`;
  `cut` — корҳои такрорӣ бе сабт. Камера ба элемент зум мекунад ва гирдашро равшан нишон медиҳад (`src/LiveTutorial.tsx`).
- Файлҳо ба сервер: `out/live/*.mp4|jpg` → `/var/www/ikhtisosiman/videos/` (`<id>-<lang>.mp4`, телефон `<id>-<lang>-m.mp4`).

Тарзи кӯҳна (скриншот + садо):

```
node scripts/capture.mjs [00 02 ...] [--lang tj]   # скриншотҳо → public/v/<id>/<lang>/
node scripts/voice.mjs   [00 02 ...] [--lang tj]   # садо (/api/voice/speak) ва давомнокӣ
node scripts/render.mjs  [00 02 ...] [--lang tj]   # out/<id>-<lang>.mp4 ва .jpg (муқова)
node scripts/stills.mjs 00 tj 5 12                 # санҷиши чанд кадр
```

- Сенарияҳо ва матни садо: `scripts/videos.mjs` (ниг. `docs/naqshaho/SENARIYAI-VIDEOHOI-OMUZISHI.md`).
- Қолаби видео: `src/Tutorial.tsx` (муқаддима → саҳнаҳо бо курсор, зум ва зерсарлавҳа → охир).
- Дар сервер: файлҳо дар `/var/www/ikhtisosiman/videos/`; сайт онҳоро дар `/help` ва тугмаи «▶ Чӣ тавр кор мекунад?» нишон медиҳад.
- Диски C: пур бошад: лоиҳаро дар D: нигоҳ доред ва `TEMP=D:\tmp` гузоред.
