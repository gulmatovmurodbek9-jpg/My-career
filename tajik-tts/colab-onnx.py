# ═══════════════════════════════════════════════════════════════════════════
#  Модели fine-tune-и тоҷикиро ба ONNX табдил медиҳад ва сифаташро месанҷад.
#
#  Дар Google Colab як катак — нусха гиред ва иҷро кунед.
#  Дар охир tajik-onnx.zip зеркашӣ мешавад.
#
#  Дарунаш:
#    onnx/model.onnx      — модел (fp32, бе quantization)
#    config.json + токенизатор — барои @huggingface/transformers
#    tokenizer-test.json  — барои санҷиши баробарии токенизатор дар Node
#    compare/*.wav        — PyTorch ва ONNX паҳлӯ ба паҳлӯ
# ═══════════════════════════════════════════════════════════════════════════

MODEL_DIR = "/content/drive/MyDrive/tajik-tts/model"   # ← модели fine-tune-и шумо

print("1/7  Google Drive…")
from google.colab import drive
drive.mount('/content/drive')

import os, json, shutil, glob, time

if not os.path.exists(f"{MODEL_DIR}/config.json"):
    guess = glob.glob('/content/drive/MyDrive/**/config.json', recursive=True)
    guess = [g for g in guess if 'tajik' in g.lower() or 'tgk' in g.lower()]
    if guess:
        MODEL_DIR = os.path.dirname(guess[0])
        print(f"     модел дар ҷои дигар ёфт шуд: {MODEL_DIR}")
    else:
        raise SystemExit(f"config.json дар {MODEL_DIR} нест. Роҳи дурустро нависед.")
print(f"     модел: {MODEL_DIR}")

print("\n2/7  Китобхонаҳо (2–3 дақиқа)…")
os.system('pip -q install "transformers==4.46.3" "huggingface_hub<1.0" '
          '"optimum[exporters]" onnx onnxscript onnxruntime soundfile 2>&1 | tail -2')

import numpy as np, torch, soundfile as sf, onnxruntime as ort
from transformers import VitsModel, AutoTokenizer

OUT = '/content/tajik-onnx'
shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(f'{OUT}/onnx', exist_ok=True)
os.makedirs(f'{OUT}/compare', exist_ok=True)

print("\n3/7  Моделро мекушоям…")
model = VitsModel.from_pretrained(MODEL_DIR).eval()
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
SR = model.config.sampling_rate
print(f"     sampling_rate = {SR}")

# ─────────────────────────────────────────────────────────────────────────
print("\n4/7  Табдил ба ONNX — аввал optimum…")
ONNX_PATH = f'{OUT}/onnx/model.onnx'
done = False

code = os.system(f'optimum-cli export onnx --model "{MODEL_DIR}" '
                 f'--task text-to-audio /content/opt-export 2>&1 | tail -6')
found = glob.glob('/content/opt-export/**/*.onnx', recursive=True)
if code == 0 and found:
    shutil.copy(found[0], ONNX_PATH)
    for extra in glob.glob('/content/opt-export/**/*.onnx_data', recursive=True):
        shutil.copy(extra, f'{OUT}/onnx/')
    done = True
    print(f"     optimum: ОК")
else:
    print("     optimum нашуд → torch.onnx.export")

if not done:
    class Wrapper(torch.nn.Module):
        def __init__(self, inner):
            super().__init__()
            self.inner = inner
        def forward(self, input_ids, attention_mask):
            return self.inner(input_ids=input_ids, attention_mask=attention_mask).waveform

    sample = tokenizer("Хуш омадед! Ман ёвари шумо ҳастам, чӣ кор кунем имрӯз?", return_tensors="pt")
    export_args = dict(
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

    # torch-и нав экспортери dynamo-ро пешфарз мегирад — он барои VITS
    # ҳанӯз хом аст. Аввал экспортери кӯҳнаи TorchScript-ро маҷбур мекунем.
    try:
        torch.onnx.export(
            Wrapper(model),
            (sample["input_ids"], sample["attention_mask"]),
            ONNX_PATH,
            dynamo=False,
            **export_args,
        )
        print("     torch.onnx.export (кӯҳна): ОК")
    except TypeError:
        torch.onnx.export(
            Wrapper(model),
            (sample["input_ids"], sample["attention_mask"]),
            ONNX_PATH,
            **export_args,
        )
        print("     torch.onnx.export: ОК")

for name in ["config.json", "vocab.json", "tokenizer_config.json",
             "special_tokens_map.json", "added_tokens.json", "preprocessor_config.json"]:
    src = f"{MODEL_DIR}/{name}"
    if os.path.exists(src):
        shutil.copy(src, f"{OUT}/{name}")

# ─────────────────────────────────────────────────────────────────────────
print("\n5/7  САНҶИШИ 1 — токенизатор (барои Node)")

SENTENCES = [
    "Кушодам.",
    "Ана ин ихтисосҳо.",
    "Санҷишро сар мекунам.",
    "Ҳисоботи шуморо кушодам.",
    "Ана нақшаи ҳуҷҷатсупорӣ.",
    "Барои супоридани ҳуҷҷат шаҳодатнома лозим аст.",
    "Ҳуқуқшинос, муҳандис ва омӯзгор.",
    "Донишгоҳи миллии Тоҷикистон дар Душанбе ҷойгир аст.",
    "Бали гузариш шашсаду ёздаҳ буд.",
    "Хуш омадед! Ман ёвари шумо ҳастам, чӣ кор кунем имрӯз?",
]

token_cases = []
for text in SENTENCES:
    ids = tokenizer(text, return_tensors="np")["input_ids"][0].tolist()
    token_cases.append({"text": text, "ids": ids})
    print(f"     {len(ids):4} токен  {text[:45]}")

with open(f'{OUT}/tokenizer-test.json', 'w', encoding='utf-8') as h:
    json.dump(token_cases, h, ensure_ascii=False, indent=1)

# ─────────────────────────────────────────────────────────────────────────
print("\n6/7  САНҶИШИ 2 — PyTorch ва ONNX паҳлӯ ба паҳлӯ")

session = ort.InferenceSession(ONNX_PATH, providers=['CPUExecutionProvider'])
print(f"     вуруди ONNX: {[i.name for i in session.get_inputs()]}")

COMPARE = SENTENCES[:2] + SENTENCES[5:8]
report = []
passed = 0

for index, text in enumerate(COMPARE, 1):
    ids = tokenizer(text, return_tensors="pt")

    torch.manual_seed(1)
    started = time.time()
    with torch.no_grad():
        torch_wave = model(**ids).waveform[0].cpu().numpy().astype(np.float32)
    torch_ms = (time.time() - started) * 1000

    try:
        started = time.time()
        onnx_wave = np.squeeze(session.run(None, {
            "input_ids": ids["input_ids"].numpy().astype(np.int64),
            "attention_mask": ids["attention_mask"].numpy().astype(np.int64),
        })[0]).astype(np.float32)
        onnx_ms = (time.time() - started) * 1000

        sf.write(f'{OUT}/compare/{index}-torch.wav', torch_wave, SR)
        sf.write(f'{OUT}/compare/{index}-onnx.wav', onnx_wave, SR)

        t_sec, o_sec = len(torch_wave) / SR, len(onnx_wave) / SR
        drift = abs(t_sec - o_sec) / max(t_sec, 0.01) * 100
        ok = drift < 20
        passed += ok
        print(f"     {'OK ' if ok else 'ФАРҚ'} {index}: torch {t_sec:.2f}s ({torch_ms:.0f}ms) | "
              f"onnx {o_sec:.2f}s ({onnx_ms:.0f}ms) | фарқ {drift:.0f}%")
        report.append({"text": text, "torchSec": t_sec, "onnxSec": o_sec, "driftPct": drift})
    except Exception as error:
        print(f"     ХАТО {index}: {str(error)[:160]}")
        report.append({"text": text, "error": str(error)[:300]})

with open(f'{OUT}/compare/report.json', 'w', encoding='utf-8') as h:
    json.dump(report, h, ensure_ascii=False, indent=1)

# ─────────────────────────────────────────────────────────────────────────
print("\n7/7  Бастабандӣ")
size = os.path.getsize(ONNX_PATH) / 1024 / 1024
print(f"     model.onnx — {size:.0f} MB, санҷиш {passed}/{len(COMPARE)}")

if passed < len(COMPARE):
    print("     ДИҚҚАТ: ҳамаи ҷумлаҳо нагузаштанд — ин матнро ба Клод нишон диҳед.")

shutil.make_archive('/content/tajik-onnx', 'zip', OUT)
from google.colab import files
files.download('/content/tajik-onnx.zip')
print("\nТамом.")
