# Моделҳои овоз

Ёвари овозии «Ихтисоси ман» бо се забон гап мезанад. Забон аз забони сайт меояд
(`/api/voice/speak?lang=tj|ru|en`).

| Забон | Овоз | Модел / папка | Sample rate | Муҳаррик |
|---|---|---|---|---|
| tj | овози муаллифи лоиҳа | `../voice-model/` (MMS-tgk, fine-tune) | 16000 | `onnxruntime-node`, дар process-и асосӣ |
| ru | Piper **Dmitri**, sid 0, noise 0,3 / 0,4 | `vits-piper-ru_RU-dmitri-medium/` | 22050 | `sherpa-onnx-node`, process-и алоҳида (`tts-worker.js`) |
| en | **Kokoro** v1.0, **am_echo** (sid 12), 2 thread | `kokoro-multi-lang-v1_0/` | 24000 | `sherpa-onnx-node`, process-и алоҳида |

Моделҳои ru/en дар git нестанд. Дар сервер: `bash scripts/download-tts-models.sh`.

## ⚠️ Иҷозатномаҳо — лоиҳа ҒАЙРИТИҶОРАТӢ аст

| Ҷузъ | Иҷозатнома | Маъно |
|---|---|---|
| Овози тоҷикӣ (`voice-model/`, асос: `facebook/mms-tts-tgk`) | **CC-BY-NC 4.0** | танҳо ғайритиҷоратӣ, бо зикри манбаъ (Meta MMS) |
| Piper **Dmitri** (ru) | маълумот: CC0; **модел аз `en_US-lessac` fine-tune шудааст** — lessac = Blizzard 2013 license: танҳо тадқиқот, **истифодаи тиҷоратӣ манъ** | **танҳо ғайритиҷоратӣ** |
| **Kokoro-82M** v1.0 (en) | **Apache-2.0** | озод, тиҷоратӣ ҳам мумкин |
| `espeak-ng-data` (дар ҳарду архиви ru/en) | **GPL-3.0** | дар сервер истифода бурдан мумкин; ҳангоми паҳн кардани нармафзор — сарчашма лозим |
| `sherpa-onnx` / `sherpa-onnx-node` | Apache-2.0 | озод |

**Агар сайт тиҷоратӣ шавад:** овози тоҷикӣ ва Dmitri бояд иваз шаванд (Kokoro метавонад монад).

Манбаъҳо:
- Dmitri: https://huggingface.co/rhasspy/piper-voices (ru/ru_RU/dmitri/medium, MODEL_CARD); lessac license: https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html
- Kokoro: https://huggingface.co/hexgrad/Kokoro-82M (LICENSE дар архив)
- Архивҳо: https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models

## Танзимот (`.env`)
- `TTS_RU_EN=sherpa` (пешфарз) — Dmitri ва Kokoro.
- `TTS_RU_EN=mms` — баргардонидан ба моделҳои пештараи MMS бе тағйири код (`voice-model-rus/`, `voice-model-eng/`).

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
| Dmitri | 0,16 | ~250 МБ |
| Kokoro, 2 thread | 0,69 | ~650 МБ |
| ҳарду дар process | ru 0,11 · en 0,72 | 831 МБ, озод 1410 МБ |
