# ═══════════════════════════════════════════════════════════════════
#  Модели VITS-ро ба ONNX табдил медиҳад.
#  Баъди ин backend-и Node худаш овоз месозад — бе Python, бе ElevenLabs.
#
#  Дар Google Colab иҷро кунед. Дар охир ду файл зеркашӣ мешавад:
#    tajik-tts.onnx   — худи модел
#    tajik-tts.json   — луғат ва танзимот
# ═══════════════════════════════════════════════════════════════════

!pip -q install "transformers>=4.41" "optimum[exporters]" onnx onnxruntime soundfile

import json, os, shutil
import torch
from transformers import VitsModel, AutoTokenizer

# Агар zip бор карда бошед: !unzip -q /content/tajik-tts-model.zip -d /content/tajik-tts-model
MODEL_DIR = "/content/tajik-tts-model"
OUT_DIR = "/content/tajik-onnx"
os.makedirs(OUT_DIR, exist_ok=True)

model = VitsModel.from_pretrained(MODEL_DIR)
model.eval()
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)

# ── Ҷумлаи намунавӣ. Дароз бошад беҳтар — то шаклҳо васеъ трас шаванд.
SAMPLE = "Хуш омадед! Ман ёвари шумо ҳастам, чӣ кор кунем имрӯз?"
example = tokenizer(SAMPLE, return_tensors="pt")

print("=== 1. Кӯшиши аввал: optimum ===")
ok = False
try:
    os.system(f"optimum-cli export onnx --model {MODEL_DIR} --task text-to-audio {OUT_DIR}/optimum")
    candidate = None
    for root, _, files in os.walk(f"{OUT_DIR}/optimum"):
        for f in files:
            if f.endswith(".onnx"):
                candidate = os.path.join(root, f)
    if candidate:
        shutil.copy(candidate, f"{OUT_DIR}/tajik-tts.onnx")
        ok = True
        print(f"   OK — {candidate}")
except Exception as error:
    print(f"   нашуд: {error}")

if not ok:
    print("\n=== 2. Кӯшиши дуюм: torch.onnx.export ===")

    class Wrapper(torch.nn.Module):
        def __init__(self, inner):
            super().__init__()
            self.inner = inner

        def forward(self, input_ids, attention_mask):
            return self.inner(input_ids=input_ids, attention_mask=attention_mask).waveform

    torch.onnx.export(
        Wrapper(model),
        (example["input_ids"], example["attention_mask"]),
        f"{OUT_DIR}/tajik-tts.onnx",
        input_names=["input_ids", "attention_mask"],
        output_names=["waveform"],
        dynamic_axes={
            "input_ids": {0: "batch", 1: "sequence"},
            "attention_mask": {0: "batch", 1: "sequence"},
            "waveform": {0: "batch", 1: "samples"},
        },
        opset_version=17,
        do_constant_folding=True,
    )
    print("   OK")

# ── Луғат ва танзимот барои токенизатори JavaScript.
with open(f"{MODEL_DIR}/vocab.json", encoding="utf-8") as handle:
    vocab = json.load(handle)
with open(f"{MODEL_DIR}/tokenizer_config.json", encoding="utf-8") as handle:
    tok_cfg = json.load(handle)

meta = {
    "vocab": vocab,
    "addBlank": tok_cfg.get("add_blank", True),
    "normalize": tok_cfg.get("normalize", True),
    "padToken": tok_cfg.get("pad_token", "о"),
    "unkToken": tok_cfg.get("unk_token", "<unk>"),
    "samplingRate": model.config.sampling_rate,
}
with open(f"{OUT_DIR}/tajik-tts.json", "w", encoding="utf-8") as handle:
    json.dump(meta, handle, ensure_ascii=False, indent=1)

# ── САНҶИШ: ONNX ҳамон садоро медиҳад ё не, ва бо дарозии ДИГАР кор мекунад?
print("\n=== 3. Санҷиш ===")
import numpy as np, onnxruntime as ort, soundfile as sf

session = ort.InferenceSession(f"{OUT_DIR}/tajik-tts.onnx", providers=["CPUExecutionProvider"])
print("   вуруд:", [i.name for i in session.get_inputs()])
print("   баромад:", [o.name for o in session.get_outputs()])

for label, text in [("kutoh", "Кушодам."), ("daroz", "Барои супоридани ҳуҷҷат шаҳодатнома ва маълумотномаи тиббӣ лозим аст.")]:
    ids = tokenizer(text, return_tensors="np")
    audio = session.run(None, {
        "input_ids": ids["input_ids"].astype(np.int64),
        "attention_mask": ids["attention_mask"].astype(np.int64),
    })[0]
    wave = np.squeeze(audio)
    sf.write(f"{OUT_DIR}/test-{label}.wav", wave, meta["samplingRate"])
    print(f"   {label}: {len(wave)} намуна = {len(wave)/meta['samplingRate']:.1f} сония")

size = os.path.getsize(f"{OUT_DIR}/tajik-tts.onnx") / 1024 / 1024
print(f"\ntajik-tts.onnx — {size:.0f} MB")

shutil.make_archive("/content/tajik-onnx", "zip", OUT_DIR)
from google.colab import files
files.download("/content/tajik-onnx.zip")
