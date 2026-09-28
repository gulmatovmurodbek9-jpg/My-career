# ═══════════════════════════════════════════════════════════════════
#  Модели русӣ бо ОВОЗИ ХУДАТОН: fine-tune аз facebook/mms-tts-rus.
#  Ҳамон роҳе, ки модели тоҷикӣ сохта шуд — танҳо забон ва сабтҳо дигар.
#
#  Google Colab: Runtime → Change runtime type → T4 GPU.
#  Ҳар қисмро (# ── N.) ба катаки алоҳида нусха кунед ва бо тартиб иҷро кунед.
#  Агар модели тоҷикиро бо дафтарчаи худатон омӯзонда бошед — ҳамонро
#  истифода баред ва танҳо language_code=rus ва сабтҳоро иваз кунед.
# ═══════════════════════════════════════════════════════════════════

# ── 1. GPU ва Google Drive (натиҷа дар Drive нигоҳ дошта мешавад)
!nvidia-smi --query-gpu=name,memory.total --format=csv
from google.colab import drive
drive.mount("/content/drive")

# ── 2. Абзори fine-tune
%cd /content
!git clone -q https://github.com/ylacombe/finetune-hf-vits.git
%cd /content/finetune-hf-vits
!pip -q install -r requirements.txt
%cd /content/finetune-hf-vits/monotonic_align
!mkdir -p monotonic_align && python setup.py build_ext --inplace
%cd /content/finetune-hf-vits

# ── 3. Модели русӣ бо discriminator (барои омӯзиш лозим аст)
!python convert_original_discriminator_checkpoint.py \
    --language_code rus \
    --pytorch_dump_folder_path /content/mms-rus-train

# ── 4. Сабтҳо: ZIP-и саҳифаи сабт (ovoz-rus-NNN.zip)-ро бор кунед
from google.colab import files
uploaded = files.upload()                      # ovoz-rus-191.zip
zip_name = next(iter(uploaded))
!rm -rf /content/dataset && mkdir -p /content/dataset
!unzip -q "/content/{zip_name}" -d /content/dataset
!ls /content/dataset/wavs | wc -l && head -3 /content/dataset/metadata.csv

# ── 5. Танзими омӯзиш
import json
config = {
    "project_name": "mms_rus_murod",
    "push_to_hub": False,
    "report_to": ["tensorboard"],
    "overwrite_output_dir": True,
    "output_dir": "/content/drive/MyDrive/tajik-tts/model-rus",   # ← модели тайёр ин ҷо мешавад
    "dataset_name": "/content/dataset",
    "audio_column_name": "audio",
    "text_column_name": "text",
    "train_split_name": "train",
    "eval_split_name": "train",
    "full_generation_sample_text": "Добро пожаловать! Я ваш помощник. Чем займёмся?",
    "max_duration_in_seconds": 20,
    "min_duration_in_seconds": 0.5,
    "max_tokens_length": 500,
    "model_name_or_path": "/content/mms-rus-train",
    "preprocessing_num_workers": 2,
    "do_train": True,
    "num_train_epochs": 200,          # ~190 сабт → ~25–35 дақиқа дар T4
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
json.dump(config, open("/content/finetune_rus.json", "w"), ensure_ascii=False, indent=2)
print("танзим тайёр")

# ── 6. Омӯзиш (дароз — Colab-ро напӯшед)
!accelerate launch run_vits_finetuning.py /content/finetune_rus.json

# ── 7. Санҷиш: гӯш кунед, ки овози шумост
import torch, IPython.display as ipd
from transformers import VitsModel, AutoTokenizer
MODEL = "/content/drive/MyDrive/tajik-tts/model-rus"
model = VitsModel.from_pretrained(MODEL).eval()
tok = AutoTokenizer.from_pretrained(MODEL)
model.speaking_rate = 1.3
for text in ["Добро пожаловать! Я ваш помощник.", "Вот университеты рядом с вами.", "Хотите сохранить её или сравнить с другой?"]:
    with torch.no_grad():
        wave = model(**tok(text, return_tensors="pt")).waveform[0].numpy()
    ipd.display(ipd.Audio(wave, rate=model.config.sampling_rate))

# ── 8. ONNX барои сервер: colab-onnx.py-ро иҷро кунед ва дар он
#       MODEL_DIR = "/content/drive/MyDrive/tajik-tts/model-rus"
#       гузоред. model.onnx ва tokenizer-ро ба ман диҳед (мисли тоҷикӣ).
