# Модели кӯҳна ва нави тоҷикиро муқоиса мекунад: ҳамон ҷумлаҳо → WAV → шинохти нутқ.
#   .venv\Scripts\python.exe compare-models.py
# Натиҷа: tajik-tts/compare/muqoisa/{kuhna,nav}-N.wav — худатон гӯш кунед.
import json, os, re, sys, time, urllib.request
import numpy as np, onnxruntime as ort, soundfile as sf

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
BACK = os.path.join(HERE, "..", "Back", "nest-backend")
OUT = os.path.join(HERE, "compare", "muqoisa")
os.makedirs(OUT, exist_ok=True)

SENTENCES = [
    # Дар сабтҳо буданд:
    "Хуш омадед! Ман ёвари шумо ҳастам.",
    "Ана донишгоҳҳои наздиктарин.",
    # Нав — модел онҳоро надидааст:
    "Барои иқтисодчӣ шудан ин самтҳо ҳастанд.",
    "Донишгоҳи техникӣ дар шаҳри Хуҷанд низ филиал дорад.",
    "Маоши миёна дар ин соҳа чор ҳазор сомонӣ аст.",
    "Ман ба шумо дар интихоби касб ёрӣ медиҳам.",
]
MODELS = {"kuhna": os.path.join(BACK, "voice-model"), "nav": os.path.join(BACK, "voice-model-tgk")}


def encode(meta, text):
    source = text.lower() if meta["normalize"] else text
    ids = [meta["vocab"][c] for c in source if c in meta["vocab"]]
    if not meta["addBlank"]:
        return ids
    pad = meta["vocab"].get(meta["padToken"], 0)
    spaced = [pad] * (len(ids) * 2 + 1)
    spaced[1::2] = ids
    return spaced


def stt(path):
    env = open(os.path.join(BACK, ".env"), encoding="utf-8").read()
    key = re.search(r"^ELEVENLABS_API_KEY=(.*)$", env, re.M).group(1).strip()
    boundary = "----ovoz"
    body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"model_id\"\r\n\r\nscribe_v1\r\n"
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"language_code\"\r\n\r\ntgk\r\n"
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"a.wav\"\r\nContent-Type: audio/wav\r\n\r\n").encode()
    body += open(path, "rb").read() + f"\r\n--{boundary}--\r\n".encode()
    request = urllib.request.Request("https://api.elevenlabs.io/v1/speech-to-text", data=body,
                                     headers={"xi-api-key": key, "Content-Type": f"multipart/form-data; boundary={boundary}"})
    for attempt in range(3):
        try:
            return json.loads(urllib.request.urlopen(request, timeout=60).read())["text"]
        except Exception as error:
            if attempt == 2:
                return f"[STT нашуд: {error}]"
            time.sleep(2)


def similarity(a, b):
    norm = lambda s: re.sub(r"[^\w ]", "", s.lower()).split()
    wa, wb = norm(a), norm(b)
    return sum(1 for w in wa if w in wb) / max(1, len(wa))


scores = {name: [] for name in MODELS}
for name, folder in MODELS.items():
    meta = json.load(open(os.path.join(folder, "tajik-tts.json"), encoding="utf-8"))
    session = ort.InferenceSession(os.path.join(folder, "onnx", "model.onnx"), providers=["CPUExecutionProvider"])
    for index, text in enumerate(SENTENCES, 1):
        ids = np.array([encode(meta, text)], dtype=np.int64)
        started = time.time()
        wave = session.run(None, {"input_ids": ids, "attention_mask": np.ones_like(ids)})[0][0]
        took = time.time() - started
        path = os.path.join(OUT, f"{name}-{index}.wav")
        sf.write(path, wave, 16000)
        heard = stt(path)
        score = similarity(text, heard)
        scores[name].append(score)
        print(f"{name:5} {index}  {len(wave) / 16000:4.1f}с  синтез {took:.2f}с  фаҳмо {score:4.0%}  → {heard}")

print()
for name, values in scores.items():
    print(f"{name:5}: фаҳмо будан миёна {np.mean(values):.0%}")
print(f"\nФайлҳо барои гӯш кардан: {OUT}")
