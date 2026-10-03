# Моделҳои овоз

Ёвари овозии «Ихтисоси ман» бо се забон гап мезанад. Забон аз забони сайт меояд
(`/api/voice/speak?lang=tj|ru|en`).

| Забон | Овоз | Модел / папка | Sample rate | Муҳаррик |
|---|---|---|---|---|
| tj | овози муаллифи лоиҳа | `../voice-model/` (MMS-tgk, fine-tune) | 16000 | `onnxruntime-node`, дар process-и асосӣ |
| ru | Piper **Ruslan**, sid 0, noise 0,5 / 0,6 | `vits-piper-ru_RU-ruslan-medium/` | 22050 | `sherpa-onnx-node`, process-и алоҳида (`tts-worker.js`) |
| en | Piper **Ryan** (мардона), sid 0, noise 0,5 / 0,6 | `vits-piper-en_US-ryan-medium/` | 22050 | `sherpa-onnx-node`, process-и алоҳида |

Моделҳои ru/en дар git нестанд. Дар сервер: `bash scripts/download-tts-models.sh`.

## ⚠️ Иҷозатномаҳо — лоиҳа ҒАЙРИТИҶОРАТӢ аст

| Ҷузъ | Иҷозатнома | Маъно |
|---|---|---|
| Овози тоҷикӣ (`voice-model/`, асос: `facebook/mms-tts-tgk`) | **CC-BY-NC 4.0** | танҳо ғайритиҷоратӣ, бо зикри манбаъ (Meta MMS) |
| Piper **Ruslan** (ru) | маълумот (RUSLAN corpus): **CC BY-NC-SA 4.0**; модел аз `en_US-lessac` fine-tune шудааст — lessac = Blizzard 2013 license: танҳо тадқиқот, **истифодаи тиҷоратӣ манъ** | **танҳо ғайритиҷоратӣ**, бо зикри манбаъ; тағйирот — бо ҳамон иҷозатнома (ShareAlike) |
| Piper **Ryan** (en) | маълумот (RyanSpeech): **CC BY-NC-SA 4.0**; аз `en_US-lessac` fine-tune | **танҳо ғайритиҷоратӣ**, ShareAlike |
| `espeak-ng-data` (дар ҳарду архиви ru/en) | **GPL-3.0** | дар сервер истифода бурдан мумкин; ҳангоми паҳн кардани нармафзор — сарчашма лозим |
| `sherpa-onnx` / `sherpa-onnx-node` | Apache-2.0 | озод |

**Агар сайт тиҷоратӣ шавад:** ҳар се овоз (тоҷикӣ, Ruslan, Ryan) бояд иваз шаванд.

Манбаъҳо:
- Ruslan: https://huggingface.co/rhasspy/piper-voices (ru/ru_RU/ruslan/medium, MODEL_CARD); корпус: https://ruslan-corpus.github.io/; lessac license: https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html
- Ryan: https://huggingface.co/rhasspy/piper-voices (en/en_US/ryan/medium, MODEL_CARD); корпус RyanSpeech
- Архивҳо: https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models

## Танзимот (`.env`)
- `TTS_RU_EN=sherpa` (пешфарз) — Ruslan ва Ryan.
- `TTS_RU_EN=mms` — баргардонидан ба моделҳои пештараи MMS бе тағйири код (`voice-model-rus/`, `voice-model-eng/`).
- `TTS_PRELOAD=0` — моделҳоро ҳангоми оғоз бор накардан (пешфарз: баъди 3 с бор мешаванд).
- `ASSISTANT_MODEL=lite` (пешфарз) ё `flash` — модели AI-и ёвар: `gemini-flash-lite` (~0,9 с) ё `gemini-flash` (~1,4 с).

## Чӣ тавр кор мекунад
- Process-и ru/en порти шабака намекушояд — танҳо канали IPC бо process-и асосӣ.
- Приоритети паст (`nice 10`): дархостҳои веб ва Postgres ҳамеша пеш.
- Агар process афтад — худкор аз нав оғоз мешавад (1 → 2 → 4 … то 30 с). Овози тоҷикӣ ва сайт кор мекунанд.
- Агар 30 сония ҷавоб надиҳад — 504 `TTS_TIMEOUT` («Голос задерживается — прочитайте текст»), process аз нав.
- Як синтез дар як вақт (ҳамаи забонҳо); агар дар навбат > 4 бошад — 503 `TTS_BUSY` («Помощник сейчас занят…»).
- Кэш: `voice-cache/<sha1(забон|модел|матн)>.wav`.
- Модел танҳо бори аввал, ки забонаш лозим шуд, ба RAM бор мешавад.

## Ченкунӣ дар сервер (02.10.2026, 2 ядро, 3,4 ГБ RAM)
| | RTF | RAM |
|---|---|---|
| Ruslan | ≈ Dmitri (0,16)¹ | ~180–250 МБ |
| Ryan (03.10.2026) | ~0,12 (ҷумлаи нав 0,3–0,6 с) | ~200 МБ |

¹ Дар компютер Ruslan RTF 0,077 бар Dmitri 0,081, RAM +176 МБ бар +201 МБ. Ченкунии сервер баъди deploy.
Dmitri 02.10.2026 бо Ruslan иваз ва пурра нест карда шуд. Kokoro 03.10.2026 бо Ryan иваз ва пурра нест карда шуд (5–7× сусттар буд).
