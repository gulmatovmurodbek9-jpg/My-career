# Санҷиш: оё таваққуфи хурд пеш аз матн («— ») калимаи аввалро нигоҳ медорад?
#   .venv\Scripts\python.exe test-lead-pause.py voice-model-nav
import json, os, re, sys, time, urllib.request
import numpy as np, onnxruntime as ort, soundfile as sf

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
BACK = os.path.join(HERE, "..", "Back", "nest-backend")
folder = os.path.join(BACK, sys.argv[1] if len(sys.argv) > 1 else "voice-model-nav")
OUT = os.path.join(HERE, "compare", "pause")
os.makedirs(OUT, exist_ok=True)

SENTENCES = [
    "Хуш омадед! Ман ёвари шумо ҳастам.",
    "Барои иқтисодчӣ шудан ин самтҳо ҳастанд.",
    "Донишгоҳи техникӣ дар шаҳри Хуҷанд филиал дорад.",
    "Маоши миёна дар ин соҳа чор ҳазор сомонӣ аст.",
    "Ман ба шумо дар интихоби касб ёрӣ медиҳам.",
    "Кушодам.",
]
meta = json.load(open(os.path.join(folder, "tajik-tts.json"), encoding="utf-8"))
session = ort.InferenceSession(os.path.join(folder, "onnx", "model.onnx"), providers=["CPUExecutionProvider"])
key = re.search(r"^ELEVENLABS_API_KEY=(.*)$", open(os.path.join(BACK, ".env"), encoding="utf-8").read(), re.M).group(1).strip()


def encode(text):
    source = text.lower() if meta["normalize"] else text
    ids = [meta["vocab"][c] for c in source if c in meta["vocab"]]
    pad = meta["vocab"].get(meta["padToken"], 0)
    spaced = [pad] * (len(ids) * 2 + 1)
    spaced[1::2] = ids
    return spaced


def stt(path):
    boundary = "----p"
    body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"model_id\"\r\n\r\nscribe_v1\r\n"
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"language_code\"\r\n\r\ntgk\r\n"
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"a.wav\"\r\nContent-Type: audio/wav\r\n\r\n").encode()
    body += open(path, "rb").read() + f"\r\n--{boundary}--\r\n".encode()
    for attempt in range(4):
        try:
            request = urllib.request.Request("https://api.elevenlabs.io/v1/speech-to-text", data=body,
                                             headers={"xi-api-key": key, "Content-Type": f"multipart/form-data; boundary={boundary}"})
            return json.loads(urllib.request.urlopen(request, timeout=60).read())["text"]
        except Exception:
            time.sleep(3)
    return "?"


first = lambda s: (re.sub(r"[^\w\s]", "", s.lower()).split() or [""])[0]
score = {"бе": 0, "бо": 0}
for index, text in enumerate(SENTENCES, 1):
    for label, prefix in (("бе", ""), ("бо", "— ")):
        ids = np.array([encode(prefix + text)], dtype=np.int64)
        np.random.seed(index)
        wave = session.run(None, {"input_ids": ids, "attention_mask": np.ones_like(ids)})[0][0]
        path = os.path.join(OUT, f"{label}-{index}.wav")
        sf.write(path, wave, 16000)
        heard = stt(path)
        ok = first(heard)[:3] == first(text)[:3]
        score[label] += ok
        print(f"{'✓' if ok else '✗'} {label} таваққуф  {text[:32]:<32} → {heard}")
print(f"\nкалимаи аввал: бе таваққуф {score['бе']}/{len(SENTENCES)}, бо таваққуф {score['бо']}/{len(SENTENCES)}")
