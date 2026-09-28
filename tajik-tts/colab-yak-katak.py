# ═══════════════════════════════════════════════════════════════════
#  ЯК КАТАК — ҳама чиз худаш. Танҳо LANG-ро дар сатри поён интихоб кунед.
#
#  Пеш аз иҷро:
#   1. Дар Google Drive папкаи «tajik-tts» созед ва ZIP-ро (ovoz-tgk-178.zip)
#      ба он ҷо бор кунед (drive.google.com → Навый → Загрузить файлы).
#   2. Colab: Среда выполнения → Сменить среду выполнения → T4 GPU → Сохранить.
#   3. Ин кодро ба як катак гузоред ва ▶ пахш кунед. ~35 дақиқа.
#  Натиҷа: Drive/tajik-tts/model-<LANG> — онро ба ман диҳед.
# ═══════════════════════════════════════════════════════════════════
LANG = "tgk"          # ← "tgk" тоҷикӣ, "rus" русӣ, "eng" англисӣ

import glob, json, os, torch
SAMPLES = {
    "tgk": ["Хуш омадед! Ман ёвари шумо ҳастам.", "Ана донишгоҳҳои наздиктарин.", "Мехоҳед захира кунам ё бо дигараш муқоиса кунем?"],
    "rus": ["Добро пожаловать! Я ваш помощник.", "Вот университеты рядом с вами.", "Хотите сохранить ее или сравнить с другой?"],
    "eng": ["Welcome! I am your assistant.", "Here are the universities near you.", "Would you like to save it or compare it with another one?"],
}

print("1/6  GPU…")
assert torch.cuda.is_available(), "GPU нест! Среда выполнения → Сменить среду выполнения → T4 GPU → Сохранить, баъд боз ▶"
print("     ", torch.cuda.get_device_name(0))

print("2/6  Google Drive…")
from google.colab import drive
drive.mount("/content/drive")
found = sorted(glob.glob(f"/content/drive/MyDrive/tajik-tts/ovoz-{LANG}-*.zip") + glob.glob(f"/content/drive/MyDrive/ovoz-{LANG}-*.zip"))
assert found, f"ZIP ёфт нашуд. Файли ovoz-{LANG}-….zip-ро ба Drive, папкаи tajik-tts бор кунед."
ZIP = found[-1]
print("      ZIP:", ZIP)
!rm -rf /content/dataset && mkdir -p /content/dataset && unzip -q "{ZIP}" -d /content/dataset
count = len(glob.glob("/content/dataset/wavs/*.wav"))
print("      сабтҳо:", count)
assert count > 50, "Сабтҳо кам ҳастанд — ZIP-ро санҷед."

print("3/6  Абзори омӯзиш (~3 дақ)…")
if not os.path.exists("/content/finetune-hf-vits"):
    !git clone -q https://github.com/ylacombe/finetune-hf-vits.git /content/finetune-hf-vits
    !pip -q install -r /content/finetune-hf-vits/requirements.txt
    %cd /content/finetune-hf-vits/monotonic_align
    !mkdir -p monotonic_align && python setup.py build_ext --inplace -q
# finetune-hf-vits барои transformers 4.x навишта шудааст; Colab 5.x дорад
# («pad_token_id», «send_example_telemetry»). Версияҳои мувофиқро маҷбур мекунем.
!pip -q install "transformers==4.46.3" "huggingface_hub<1.0" "datasets>=2.19,<4"
%cd /content/finetune-hf-vits
import subprocess
print("      transformers:", subprocess.run(["python", "-c", "import transformers; print(transformers.__version__)"], capture_output=True, text=True).stdout.strip())

print("4/6  Модели асосӣ…")
if not os.path.exists(f"/content/mms-{LANG}-train/config.json"):
    !python convert_original_discriminator_checkpoint.py --language_code {LANG} --pytorch_dump_folder_path /content/mms-{LANG}-train
assert os.path.exists(f"/content/mms-{LANG}-train/config.json"), "Модели асосӣ сохта нашуд — хатои болоро ба ман фиристед."

OUT = f"/content/drive/MyDrive/tajik-tts/model-{LANG}"
config = {
    "project_name": f"mms_{LANG}_murod", "push_to_hub": False, "report_to": ["tensorboard"],
    "overwrite_output_dir": True, "output_dir": OUT,
    "dataset_name": "/content/dataset", "audio_column_name": "audio", "text_column_name": "text",
    "train_split_name": "train", "eval_split_name": "train",
    "full_generation_sample_text": SAMPLES[LANG][0],
    "max_duration_in_seconds": 20, "min_duration_in_seconds": 0.5, "max_tokens_length": 500,
    "model_name_or_path": f"/content/mms-{LANG}-train",
    "preprocessing_num_workers": 2, "do_train": True, "num_train_epochs": 200,
    "gradient_accumulation_steps": 1, "gradient_checkpointing": False,
    "per_device_train_batch_size": 16, "learning_rate": 2e-5,
    "adam_beta1": 0.8, "adam_beta2": 0.99, "warmup_ratio": 0.01, "group_by_length": False,
    "do_eval": True, "eval_steps": 100, "per_device_eval_batch_size": 16, "max_eval_samples": 16,
    "do_step_schedule_per_epoch": True,
    "weight_disc": 3, "weight_fmaps": 1, "weight_gen": 1, "weight_kl": 1.5, "weight_duration": 1, "weight_mel": 35,
    "fp16": True, "seed": 456,
}
json.dump(config, open(f"/content/finetune_{LANG}.json", "w"), ensure_ascii=False, indent=2)

print("5/6  ОМӮЗИШ (~30 дақ) — саҳифаро напӯшед…")
!accelerate launch run_vits_finetuning.py /content/finetune_{LANG}.json
assert os.path.exists(f"{OUT}/model.safetensors") or os.path.exists(f"{OUT}/pytorch_model.bin"), "Омӯзиш тамом нашуд — хатои болоро ба ман фиристед."

print("6/6  Гӯш кунед — ин овози шумост:")
import IPython.display as ipd
from transformers import VitsModel, AutoTokenizer
model = VitsModel.from_pretrained(OUT).eval()
tok = AutoTokenizer.from_pretrained(OUT)
model.speaking_rate = 1.3
for text in SAMPLES[LANG]:
    with torch.no_grad():
        wave = model(**tok(text, return_tensors="pt")).waveform[0].numpy()
    print("   ", text)
    ipd.display(ipd.Audio(wave, rate=model.config.sampling_rate))
print(f"\nТАЙЁР! Модел дар Drive: tajik-tts/model-{LANG} — ин папкаро ба ман диҳед.")
