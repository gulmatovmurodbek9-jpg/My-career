# ═══════════════════════════════════════════════════════════════════
#  Як овоз — се забон: fine-tune аз facebook/mms-tts-{tgk,rus,eng}.
#  Барои ҳар забон ин скриптро як бор иҷро кунед: дар қисми 0 LANG-ро
#  иваз кунед ва ZIP-и ҳамон забонро (ovoz-tgk / ovoz-rus / ovoz-eng) бор кунед.
#
#  Google Colab: Runtime → Change runtime type → T4 GPU.
#  Ҳар қисмро (# ── N.) ба катаки алоҳида нусха кунед ва бо тартиб иҷро кунед.
#  Қисмҳои 1–2 як бор кофӣ аст; барои забони навбатӣ аз қисми 0 ва 3 такрор кунед.
# ═══════════════════════════════════════════════════════════════════

# ── 0. ЗАБОН — ин ҷо иваз кунед: "tgk", "rus" ё "eng"
LANG = "tgk"
SAMPLE = {
    "tgk": "Хуш омадед! Ман ёвари шумо ҳастам. Чӣ кор кунем?",
    "rus": "Добро пожаловать! Я ваш помощник. Чем займемся?",   # «ё» дар луғати rus нест
    "eng": "Welcome! I am your assistant. What shall we do?",
}
TESTS = {
    "tgk": ["Хуш омадед! Ман ёвари шумо ҳастам.", "Ана донишгоҳҳои наздиктарин.", "Мехоҳед захира кунам ё бо дигараш муқоиса кунем?"],
    "rus": ["Добро пожаловать! Я ваш помощник.", "Вот университеты рядом с вами.", "Хотите сохранить ее или сравнить с другой?"],
    "eng": ["Welcome! I am your assistant.", "Here are the universities near you.", "Would you like to save it or compare it with another one?"],
}
print("Забон:", LANG)

# ── 1. GPU ва Google Drive (натиҷа дар Drive нигоҳ дошта мешавад)
!nvidia-smi --query-gpu=name,memory.total --format=csv
from google.colab import drive
drive.mount("/content/drive")

# ── 2. Абзори fine-tune (як бор)
%cd /content
!git clone -q https://github.com/ylacombe/finetune-hf-vits.git
%cd /content/finetune-hf-vits
!pip -q install -r requirements.txt
%cd /content/finetune-hf-vits/monotonic_align
!mkdir -p monotonic_align && python setup.py build_ext --inplace
%cd /content/finetune-hf-vits

# ── 3. Модели асосии забон бо discriminator (барои омӯзиш лозим аст)
!python convert_original_discriminator_checkpoint.py --language_code {LANG} --pytorch_dump_folder_path /content/mms-{LANG}-train

# ── 4. Сабтҳо: ZIP-и ҳамон забон (масалан ovoz-tgk-178.zip)-ро бор кунед
from google.colab import files
uploaded = files.upload()
zip_name = next(iter(uploaded))
assert f"ovoz-{LANG}" in zip_name, f"Ин ZIP-и забони {LANG} нест: {zip_name}"
!rm -rf /content/dataset && mkdir -p /content/dataset
!unzip -q "/content/{zip_name}" -d /content/dataset
!ls /content/dataset/wavs | wc -l && head -3 /content/dataset/metadata.csv

# ── 5. Танзими омӯзиш
import json
config = {
    "project_name": f"mms_{LANG}_murod",
    "push_to_hub": False,
    "report_to": ["tensorboard"],
    "overwrite_output_dir": True,
    "output_dir": f"/content/drive/MyDrive/tajik-tts/model-{LANG}",   # ← модели тайёр ин ҷо мешавад
    "dataset_name": "/content/dataset",
    "audio_column_name": "audio",
    "text_column_name": "text",
    "train_split_name": "train",
    "eval_split_name": "train",
    "full_generation_sample_text": SAMPLE[LANG],
    "max_duration_in_seconds": 20,
    "min_duration_in_seconds": 0.5,
    "max_tokens_length": 500,
    "model_name_or_path": f"/content/mms-{LANG}-train",
    "preprocessing_num_workers": 2,
    "do_train": True,
    "num_train_epochs": 200,          # ~180 сабт → ~25–35 дақиқа дар T4
    "gradient_accumulation_steps": 1,
    "gradient_checkpointing": False,
    "per_device_train_batch_size": 16,
    "learning_rate": 2e-5,
    "adam_beta1": 0.8,
    "adam_beta2": 0.99,
    "warmup_ratio": 0.01,
    "group_by_length": False,
    "do_eval": True,
    "eval_steps": 100,
    "per_device_eval_batch_size": 16,
    "max_eval_samples": 16,
    "do_step_schedule_per_epoch": True,
    "weight_disc": 3,
    "weight_fmaps": 1,
    "weight_gen": 1,
    "weight_kl": 1.5,
    "weight_duration": 1,
    "weight_mel": 35,
    "fp16": True,
    "seed": 456,
}
json.dump(config, open(f"/content/finetune_{LANG}.json", "w"), ensure_ascii=False, indent=2)
print("танзим тайёр:", config["output_dir"])

# ── 6. Омӯзиш (дароз — Colab-ро напӯшед)
!accelerate launch run_vits_finetuning.py /content/finetune_{LANG}.json

# ── 7. Санҷиш: гӯш кунед, ки овози шумост
import torch, IPython.display as ipd
from transformers import VitsModel, AutoTokenizer
MODEL = f"/content/drive/MyDrive/tajik-tts/model-{LANG}"
model = VitsModel.from_pretrained(MODEL).eval()
tok = AutoTokenizer.from_pretrained(MODEL)
model.speaking_rate = 1.0   # 1.3 хеле тез буд
for text in TESTS[LANG]:
    with torch.no_grad():
        wave = model(**tok("— " + text, return_tensors="pt")).waveform[0].numpy()   # «— »: калимаи аввал гум намешавад
    ipd.display(ipd.Audio(wave, rate=model.config.sampling_rate))

# ── 8. Папкаи Drive-и model-<LANG>-ро зеркашӣ кунед ва ба ман гӯед —
#       ONNX-ро дар компютер месозам (tajik-tts/export-mms-onnx.py).
#       Барои забони навбатӣ: қисми 0 (LANG) → қисмҳои 3–7.
