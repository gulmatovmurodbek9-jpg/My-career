"""Сервери хурди овоз: матни тоҷикӣ → WAV.

Иҷро:  .venv\\Scripts\\python.exe server.py
Роҳҳо: POST /api/tts   {"text": "...", "speed": 1.0}  → audio/wav
       GET  /api/health
"""
import io
import os
import sys

# Консоли Windows пешфарз cp1251 аст ва ҳарфҳои тоҷикиро чоп карда наметавонад.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
import re
import threading
import time

import numpy as np
import soundfile as sf
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from tajik_tts import TajikTTS

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(HERE, "model")
PORT = int(os.environ.get("TTS_PORT", "8123"))
MAX_TEXT = 2000
# Суръати гап. 1.0 — суст, 1.3 — табиӣ, 1.6 — тез.
DEFAULT_SPEED = float(os.environ.get("TTS_SPEED", "1.3"))

# ── Рақамҳо ────────────────────────────────────────────────────────────
# Модел рақамро намехонад: «4000» бояд «чор ҳазор» шавад.
ONES = ["сифр", "як", "ду", "се", "чор", "панҷ", "шаш", "ҳафт", "ҳашт", "нӯҳ"]
TEENS = ["даҳ", "ёздаҳ", "дувоздаҳ", "сенздаҳ", "чордаҳ", "понздаҳ",
         "шонздаҳ", "ҳабдаҳ", "ҳаждаҳ", "нуздаҳ"]
TENS = ["", "", "бист", "сӣ", "чил", "панҷоҳ", "шаст", "ҳафтод", "ҳаштод", "навад"]
HUNDREDS = ["", "сад", "дусад", "сесад", "чорсад", "панҷсад",
            "шашсад", "ҳафтсад", "ҳаштсад", "нӯҳсад"]


def _join(parts):
    parts = [p for p in parts if p]
    return "у ".join(parts) if len(parts) < 2 else parts[0] + "у " + _join(parts[1:])


def _under100(n):
    if n < 10:
        return ONES[n]
    if n < 20:
        return TEENS[n - 10]
    rest = n % 10
    return _join([TENS[n // 10], ONES[rest]]) if rest else TENS[n // 10]


def _under1000(n):
    if n < 100:
        return _under100(n)
    rest = n % 100
    return _join([HUNDREDS[n // 100], _under100(rest)]) if rest else HUNDREDS[n // 100]


def number_to_tajik(n):
    if n < 0:
        return "манфии " + number_to_tajik(-n)
    if n == 0:
        return ONES[0]
    if n < 1000:
        return _under1000(n)
    if n < 1_000_000:
        head = _under1000(n // 1000) + " ҳазор"
        rest = n % 1000
        return _join([head, _under1000(rest)]) if rest else head
    head = _under1000(n // 1_000_000) + " миллион"
    rest = n % 1_000_000
    return _join([head, number_to_tajik(rest)]) if rest else head


def spell_numbers(text):
    def replace(match):
        digits = re.sub(r"[\s ]", "", match.group(0))
        if not digits or len(digits) > 9:
            return match.group(0)
        tail = " " if match.group(0)[-1].isspace() else ""
        return number_to_tajik(int(digits)) + tail

    return re.sub(r"\d[\d\s ]*", replace, text)


# ── Модел ──────────────────────────────────────────────────────────────
print("Моделро мекушоям…")
_started = time.time()
tts = TajikTTS(model_dir=MODEL_DIR)
print(f"Тайёр — {time.time() - _started:.1f} сония, {tts.sr} Hz, дастгоҳ: {tts.device}")

# Як синтез дар як вақт: ду дархости ҳамзамон хотираро мехӯрад.
lock = threading.Lock()

app = FastAPI(title="Овози тоҷикӣ", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class SpeakRequest(BaseModel):
    text: str
    speed: float | None = None


@app.get("/api/health")
def health():
    return {"ok": True, "sampleRate": tts.sr, "device": tts.device, "speed": DEFAULT_SPEED}


@app.post("/api/tts")
def speak(body: SpeakRequest):
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Матн холӣ аст")
    if len(text) > MAX_TEXT:
        raise HTTPException(status_code=400, detail=f"Матн аз {MAX_TEXT} ҳарф дароз аст")

    spoken = spell_numbers(text)
    speed = min(max(body.speed or DEFAULT_SPEED, 0.5), 2.0)

    started = time.time()
    with lock:
        wave = tts.speak(spoken, speed=speed)

    # tts.speak ба охир 0.35 с хомӯшӣ илова мекунад (барои байни ҷумлаҳо). Дар охири
    # садо он танҳо интизорӣ аст: плеер то тамом шуданаш пораи навбатӣ ё гӯш
    # карданро сар намекунад. 0.08 с мегузорем, то садо ногаҳон набурад.
    tail = int(tts.sr * 0.35) - int(tts.sr * 0.08)
    if len(wave) > tail * 2:
        wave = wave[:-tail]

    buffer = io.BytesIO()
    sf.write(buffer, wave, tts.sr, format="WAV", subtype="PCM_16")
    audio = buffer.getvalue()

    seconds = len(wave) / tts.sr
    print(f"{time.time() - started:.2f}s синтез → {seconds:.2f}s садо | {spoken[:60]}")

    return Response(
        content=audio,
        media_type="audio/wav",
        headers={"X-Audio-Seconds": f"{seconds:.2f}"},
    )


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")
