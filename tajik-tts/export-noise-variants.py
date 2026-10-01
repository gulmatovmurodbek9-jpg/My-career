# Модели тоҷикии сайт (tajik-tts/model) бо сатҳҳои гуногуни «тасодуф» → ONNX.
# VITS ҳар бор садоро бо «noise» месозад: хеле зиёд — калима гоҳ хуб, гоҳ вайрон;
# хеле кам — садо якранг. Ин скрипт вариантҳоро барои санҷиш (voice-eval.js) месозад.
#   .venv\Scripts\python.exe export-noise-variants.py
import json, os, sys, time
import torch
from transformers import VitsModel, AutoTokenizer

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "Back", "nest-backend")
# Модели дигар: SRC=model-eng PREFIX=voice-model-eng- .venv\Scripts\python.exe export-noise-variants.py n20-d30
SRC = os.path.join(HERE, os.environ.get("SRC", "model"))
PREFIX = os.environ.get("PREFIX", "voice-model-")
SPEED = float(os.environ.get("SPEED", "1.15"))  # ҳамон суръати сайт

VARIANTS = {
    "n667-d80": (0.667, 0.8),   # ҳозира (пешфарзи MMS)
    "n50-d60": (0.5, 0.6),
    "n35-d45": (0.35, 0.45),
    "n20-d30": (0.2, 0.3),
    "n10-d20": (0.1, 0.2),
}
if len(sys.argv) > 1:
    VARIANTS = {k: v for k, v in VARIANTS.items() if k in sys.argv[1:]}


class Wrapper(torch.nn.Module):
    def __init__(self, inner):
        super().__init__()
        self.inner = inner

    def forward(self, input_ids, attention_mask):
        return self.inner(input_ids=input_ids, attention_mask=attention_mask).waveform


tok = AutoTokenizer.from_pretrained(SRC)
for name, (noise, noise_dur) in VARIANTS.items():
    model = VitsModel.from_pretrained(SRC).eval()
    model.speaking_rate = SPEED
    model.noise_scale = noise
    model.noise_scale_duration = noise_dur
    out = os.path.join(ROOT, f"{PREFIX}{name}")
    os.makedirs(os.path.join(out, "onnx"), exist_ok=True)
    sample = tok(os.environ.get("SAMPLE", "Хуш омадед! Ман ёвари шумо ҳастам."), return_tensors="pt")
    started = time.time()
    torch.onnx.export(
        Wrapper(model), (sample["input_ids"], sample["attention_mask"]), os.path.join(out, "onnx", "model.onnx"),
        input_names=["input_ids", "attention_mask"], output_names=["waveform"],
        dynamic_axes={"input_ids": {0: "batch", 1: "sequence"}, "attention_mask": {0: "batch", 1: "sequence"},
                      "waveform": {0: "batch", 1: "samples"}},
        opset_version=17, do_constant_folding=True, dynamo=False,
    )
    meta = {
        "vocab": tok.get_vocab(), "addBlank": bool(tok.add_blank), "normalize": bool(tok.normalize),
        "padToken": tok.pad_token, "samplingRate": model.config.sampling_rate, "speed": SPEED,
        "noiseScale": noise, "noiseScaleDuration": noise_dur, "source": f"tajik-tts/{os.path.basename(SRC)}",
    }
    json.dump(meta, open(os.path.join(out, "tajik-tts.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{name}: noise {noise}, duration {noise_dur} → {out} ({time.time() - started:.0f} с)")
