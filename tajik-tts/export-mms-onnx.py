# Модели VITS (MMS) → ONNX барои backend (onnxruntime-node), айнан мисли тоҷикӣ.
#
#   Модели худатон (fine-tune аз Colab, папка бо config.json):
#     .venv\Scripts\python.exe export-mms-onnx.py rus "C:\роҳ\ба\model-rus"
#   Моделҳои асосии Meta (санҷиш):
#     .venv\Scripts\python.exe export-mms-onnx.py
#
# Натиҷа: Back/nest-backend/voice-model-rus/ ва voice-model-eng/
#   onnx/model.onnx  +  tajik-tts.json (луғат барои токенизатори Node)
# Литсензия: CC-BY-NC 4.0 (ғайритиҷоратӣ), мисли модели тоҷикӣ.
import json, os, sys, time
import numpy as np, torch, soundfile as sf, onnxruntime as ort
from transformers import VitsModel, AutoTokenizer

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Back", "nest-backend")

# Суръат ҳангоми табдил дар модел сабт мешавад (баъд иваз намешавад).
# Тоҷикӣ 1.3 аст; моделҳои асосии MMS табиатан сусттаранд, 1.15 мувофиқ аст.
MODELS = {
    # Тоҷикӣ бо суръати 1.3 — мисли модели ҳозираи сайт (tajik-tts/server.py).
    "tgk": {"speed": 1.15, "samples": ["Хуш омадед! Ман ёвари шумо ҳастам.", "Ана донишгоҳҳои наздиктарин.", "Соли гузашта бали гузариш аз сад то сесад буд."]},
    "rus": {"speed": 1.0, "samples": ["Добро пожаловать! Я ваш помощник.", "Вот университеты рядом с вами.", "Проходной балл был двести девяносто пять."]},
    "eng": {"speed": 1.15, "samples": ["Welcome! I am your assistant.", "Here are the universities near you.", "The passing score was two hundred ninety five."]},
}


class Wrapper(torch.nn.Module):
    def __init__(self, inner):
        super().__init__()
        self.inner = inner

    def forward(self, input_ids, attention_mask):
        return self.inner(input_ids=input_ids, attention_mask=attention_mask).waveform


# Модели худи корбар: забон ва папка аз сатри фармон.
if len(sys.argv) >= 3:
    MODELS = {sys.argv[1]: {**MODELS.get(sys.argv[1], {"speed": 1.15, "samples": ["Test."]}), "path": sys.argv[2]}}

for lang, opts in MODELS.items():
    name = opts.get("path") or f"facebook/mms-tts-{lang}"
    out = os.path.join(ROOT, f"voice-model-{lang}")
    os.makedirs(os.path.join(out, "onnx"), exist_ok=True)
    print(f"\n== {name} → {out}")

    model = VitsModel.from_pretrained(name).eval()
    tok = AutoTokenizer.from_pretrained(name)
    model.speaking_rate = opts["speed"]
    # Тасодуфии VITS (noise) — ҳар бор каме дигар; seed барои муқоиса.
    torch.manual_seed(1)

    sample = tok(opts["samples"][0], return_tensors="pt")
    path = os.path.join(out, "onnx", "model.onnx")
    started = time.time()
    torch.onnx.export(
        Wrapper(model), (sample["input_ids"], sample["attention_mask"]), path,
        input_names=["input_ids", "attention_mask"], output_names=["waveform"],
        dynamic_axes={"input_ids": {0: "batch", 1: "sequence"}, "attention_mask": {0: "batch", 1: "sequence"},
                      "waveform": {0: "batch", 1: "samples"}},
        opset_version=17, do_constant_folding=True, dynamo=False,
    )
    print(f"   ONNX: {os.path.getsize(path) / 1e6:.0f} MB, {time.time() - started:.0f} с")

    # Луғат барои токенизатори Node (voice/tajik-tts.ts) — ҳамон формат.
    meta = {
        "vocab": tok.get_vocab(),
        "addBlank": bool(tok.add_blank),
        "normalize": bool(tok.normalize),
        "padToken": tok.pad_token,
        "samplingRate": model.config.sampling_rate,
        "speed": opts["speed"],
        "source": name,
    }
    json.dump(meta, open(os.path.join(out, "tajik-tts.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # Санҷиш: ONNX бояд садои дарозии ба torch наздик диҳад ва токенҳо якхела бошанд.
    session = ort.InferenceSession(path, providers=["CPUExecutionProvider"])
    os.makedirs(os.path.join(os.path.dirname(__file__), "compare"), exist_ok=True)
    for index, text in enumerate(opts["samples"]):
        ids = tok(text, return_tensors="np")
        wave = session.run(None, {"input_ids": ids["input_ids"].astype(np.int64),
                                  "attention_mask": ids["attention_mask"].astype(np.int64)})[0][0]
        with torch.no_grad():
            ref = model(**tok(text, return_tensors="pt")).waveform[0].numpy()
        ratio = len(wave) / max(1, len(ref))
        sf.write(os.path.join(os.path.dirname(__file__), "compare", f"{lang}-{index + 1}.wav"), wave, meta["samplingRate"])
        print(f"   {text[:40]:<40} {len(wave) / 16000:.2f} с (torch {len(ref) / 16000:.2f} с, {ratio:.2f})")

print("\nТайёр. Намунаҳо: tajik-tts/compare/rus-*.wav, eng-*.wav — гӯш кунед.")
