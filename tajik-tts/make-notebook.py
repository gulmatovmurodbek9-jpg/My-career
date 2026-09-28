# Дафтарчаи тайёри Colab-ро месозад: tajik-tts/ovoz-omuzish.ipynb
# Корбар онро дар Colab бор мекунад (Файл → Загрузить блокнот) ва қадамҳоро бо тартиб иҷро мекунад.
import json, os

def md(text):
    return {"cell_type": "markdown", "metadata": {}, "source": text.strip().splitlines(True)}

def code(text):
    return {"cell_type": "code", "metadata": {}, "execution_count": None, "outputs": [], "source": text.strip().splitlines(True)}

cells = [
    md("""
# 🎙️ Омӯзиши овози худам

Ҳар қадамро **аз боло ба поён** иҷро кунед: ба катак клик кунед ва **▶** (ё Shift+Enter).
То қадами пешина тамом нашавад (✅ нанависад), қадами навбатиро сар накунед.

**Пеш аз ҳама:** меню **Среда выполнения → Сменить среду выполнения → T4 GPU → Сохранить**.
"""),
    md("## Қадами 1 — забон ва GPU\nАгар русӣ ё англисӣ бошад, `\"tgk\"`-ро ба `\"rus\"` ё `\"eng\"` иваз кунед."),
    code("""
LANG = "tgk"   # "tgk" — тоҷикӣ, "rus" — русӣ, "eng" — англисӣ

import torch
assert torch.cuda.is_available(), "❌ GPU нест! Среда выполнения → Сменить среду выполнения → T4 GPU → Сохранить. Баъд ин қадамро боз иҷро кунед."
print("✅ GPU:", torch.cuda.get_device_name(0), "| забон:", LANG)
"""),
    md("## Қадами 2 — абзорҳо (~3 дақиқа)"),
    code("""
import os, subprocess
if not os.path.exists("/content/finetune-hf-vits"):
    !git clone -q https://github.com/ylacombe/finetune-hf-vits.git /content/finetune-hf-vits
    !pip -q install -r /content/finetune-hf-vits/requirements.txt
    %cd /content/finetune-hf-vits/monotonic_align
    !mkdir -p monotonic_align && python setup.py build_ext --inplace -q 2>/dev/null
# Абзор барои transformers 4.x навишта шудааст; Colab 5.x дорад.
!pip -q install "transformers==4.46.3" "huggingface_hub<1.0" "datasets>=2.19,<4" 2>/dev/null
# datasets 3.x torchvision.io.VideoReader-ро меҷӯяд, ки дар torchvision-и нав нест.
# Барои садо torchvision лозим нест.
!pip -q uninstall -y torchvision 2>/dev/null
%cd /content/finetune-hf-vits
version = subprocess.run(["python", "-c", "import transformers; print(transformers.__version__)"], capture_output=True, text=True).stdout.strip()
assert version == "4.46.3", f"❌ transformers {version} — ин қадамро боз иҷро кунед"
print("✅ Абзорҳо тайёр, transformers", version)
"""),
    md("## Қадами 3 — сабтҳо аз Google Drive\nZIP-и забон (масалан `ovoz-tgk-178.zip`) бояд дар **Google Drive** бошад — дар «Мой диск» ё дар папкаи `tajik-tts`.\nБори аввал тирезаи Google мебарояд — ҳисобро интихоб карда **иҷозат** диҳед."),
    code("""
import glob
from google.colab import drive, files
drive.mount("/content/drive")
found = sorted(glob.glob(f"/content/drive/MyDrive/ovoz-{LANG}-*.zip") + glob.glob(f"/content/drive/MyDrive/tajik-tts/ovoz-{LANG}-*.zip"),
               key=os.path.getmtime)
assert found, f"❌ Дар Google Drive файли ovoz-{LANG}-….zip нест. Онро ба «Мой диск» бор кунед ва ин қадамро боз иҷро кунед."
ZIP = found[-1]   # навтарин
print("ZIP:", ZIP)
!rm -rf /content/dataset && mkdir -p /content/dataset && unzip -q "{ZIP}" -d /content/dataset
count = len(glob.glob("/content/dataset/wavs/*.wav"))
assert count > 50, f"❌ Танҳо {count} сабт — ZIP-ро санҷед"
print(f"✅ {count} сабт тайёр")
"""),
    md("## Қадами 4 — модели асосӣ (~1 дақиқа)"),
    code("""
if not os.path.exists(f"/content/mms-{LANG}-train/config.json"):
    !python convert_original_discriminator_checkpoint.py --language_code {LANG} --pytorch_dump_folder_path /content/mms-{LANG}-train 2>&1 | tail -3
assert os.path.exists(f"/content/mms-{LANG}-train/config.json"), "❌ Модели асосӣ сохта нашуд — скриншоти ин катакро фиристед"
print("✅ Модели асосӣ тайёр")
"""),
    md("## Қадами 5 — ОМӮЗИШ (~30 дақиқа)\nСаҳифаро напӯшед ва компютерро ба хоб надиҳед. Дар поён навори пешрафт (`Steps: …%`) пайдо мешавад."),
    code("""
import json
OUT = f"/content/model-{LANG}"
SAMPLES = {
    "tgk": ["Хуш омадед! Ман ёвари шумо ҳастам.", "Ана донишгоҳҳои наздиктарин.", "Мехоҳед захира кунам ё бо дигараш муқоиса кунем?"],
    "rus": ["Добро пожаловать! Я ваш помощник.", "Вот университеты рядом с вами.", "Хотите сохранить ее или сравнить с другой?"],
    "eng": ["Welcome! I am your assistant.", "Here are the universities near you.", "Would you like to save it or compare it with another one?"],
}
config = {
    "project_name": f"mms_{LANG}_murod", "push_to_hub": False, "report_to": [],
    "overwrite_output_dir": True, "output_dir": OUT,
    "dataset_name": "/content/dataset", "audio_column_name": "audio", "text_column_name": "text",
    "train_split_name": "train", "eval_split_name": "train",
    "full_generation_sample_text": SAMPLES[LANG][0],
    "max_duration_in_seconds": 20, "min_duration_in_seconds": 0.5, "max_tokens_length": 500,
    "model_name_or_path": f"/content/mms-{LANG}-train",
    "preprocessing_num_workers": None,
    "do_train": True, "num_train_epochs": 200,
    "gradient_accumulation_steps": 1, "gradient_checkpointing": False,
    "per_device_train_batch_size": 16, "learning_rate": 2e-5,
    "adam_beta1": 0.8, "adam_beta2": 0.99, "warmup_ratio": 0.01, "group_by_length": False,
    "do_eval": False,
    "do_step_schedule_per_epoch": True,
    "weight_disc": 3, "weight_fmaps": 1, "weight_gen": 1, "weight_kl": 1.5, "weight_duration": 1, "weight_mel": 35,
    "fp16": True, "seed": 456,
}
json.dump(config, open(f"/content/finetune_{LANG}.json", "w"), ensure_ascii=False, indent=2)
os.environ["TOKENIZERS_PARALLELISM"] = "false"
!accelerate launch --mixed_precision=fp16 run_vits_finetuning.py /content/finetune_{LANG}.json 2>&1 | grep --line-buffered -v -E "BufferError|Exception ignored|_audit_fork_safety|tb_next|as_traceback|^\\s*def |^Traceback \\(most recent call last\\):$"
assert os.path.exists(f"{OUT}/model.safetensors"), "❌ Омӯзиш тамом нашуд — 30 сатри охири ин катакро фиристед"
print("✅ Омӯзиш тамом шуд!")
"""),
    md("## Қадами 6 — гӯш кунед: ин овози шумост"),
    code("""
import IPython.display as ipd
from transformers import VitsModel, AutoTokenizer
model = VitsModel.from_pretrained(OUT).eval()
tok = AutoTokenizer.from_pretrained(OUT)
model.speaking_rate = 1.3
for text in SAMPLES[LANG]:
    with torch.no_grad():
        wave = model(**tok(text, return_tensors="pt")).waveform[0].numpy()
    print("🔊", text)
    ipd.display(ipd.Audio(wave, rate=model.config.sampling_rate))
"""),
    md("## Қадами 7 — моделро ба компютер зеркашӣ кунед\nФайли `model-tgk.zip` ба «Загрузки» меафтад. Ба ман гӯед — ман онро ба сайт мегузорам."),
    code("""
keep = ["config.json", "model.safetensors", "vocab.json", "tokenizer_config.json", "special_tokens_map.json", "added_tokens.json", "preprocessor_config.json"]
!rm -rf /content/export && mkdir -p /content/export/model-{LANG}
for name in keep:
    if os.path.exists(f"{OUT}/{name}"):
        !cp "{OUT}/{name}" /content/export/model-{LANG}/
!cd /content/export && zip -q -r /content/model-{LANG}.zip model-{LANG}
files.download(f"/content/model-{LANG}.zip")
print(f"✅ model-{LANG}.zip зеркашӣ мешавад")
"""),
]

notebook = {
    "nbformat": 4, "nbformat_minor": 0,
    "metadata": {"colab": {"provenance": [], "gpuType": "T4"}, "accelerator": "GPU",
                 "kernelspec": {"name": "python3", "display_name": "Python 3"}, "language_info": {"name": "python"}},
    "cells": cells,
}
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ovoz-omuzish.ipynb")
json.dump(notebook, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok:", path)
