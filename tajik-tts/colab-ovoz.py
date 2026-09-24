# ═══════════════════════════════════════════════════════════════════
#  Овозҳои ёварро бо модели худамон месозад.
#  Дар Google Colab иҷро кунед — дар ҳамон ҷое ки моделро омӯзондед.
#
#  1. Моделро ба Colab бор кунед (папкаи tajik-tts-model ё zip)
#  2. Ин кодро ба як катак нусха кунед
#  3. Иҷро кунед — дар охир файли ovozho.zip зеркашӣ мешавад
#  4. Он zip-ро ба ман диҳед
# ═══════════════════════════════════════════════════════════════════

!pip -q install transformers soundfile

import hashlib, os, json, shutil
import torch, soundfile as sf
from transformers import VitsModel, AutoTokenizer

# ── Роҳи модел. Агар zip бор карда бошед, аввал кушоед:
#    !unzip -q /content/tajik-tts-model.zip -d /content/tajik-tts-model
MODEL_DIR = "/content/tajik-tts-model"

OUT = "/content/ovozho"
os.makedirs(OUT, exist_ok=True)

# ── Ҳарфҳои хоси тоҷикӣ барои садо иваз мешаванд.
#    Ин бояд бо sayify()-и backend ҳарф ба ҳарф якхела бошад.
SPEECH_MAP = {
    "ӯ": "у", "Ӯ": "У",
    "ӣ": "и", "Ӣ": "И",
    "ғ": "г", "Ғ": "Г",
    "қ": "к", "Қ": "К",
    "ҳ": "х", "Ҳ": "Х",
    "ҷ": "дж", "Ҷ": "Дж",
}

def sayify(text: str) -> str:
    for src, dst in SPEECH_MAP.items():
        text = text.replace(src, dst)
    return text

# ── Ҷумлаҳои собити ёвар. Ҳамин рӯйхат дар prewarm-voice.js низ ҳаст.
PHRASES = [
    "Хуш омадед! Ман ёвари шумо ҳастам. Чӣ кор кунем — ихтисос интихоб кунем, донишгоҳҳоро бинем, ё санҷиш гузарем?",
    "Ана ин ихтисосҳо.",
    "Кушодам.",
    "Муқоиса тайёр аст.",
    "Захира шуд.",
    "Санҷишро сар мекунам.",
    "Ана донишгоҳҳо.",
    "Ҳисоботи шуморо кушодам.",
    "Ана нақшаи ҳуҷҷатсупорӣ.",
    "Мебахшед, ҳозир ҷавоб дода наметавонам. Бори дигар бигӯед.",
    "Мебахшед, нафаҳмидам. Бори дигар бигӯед.",
]

print("Моделро мекушоям…")
model = VitsModel.from_pretrained(MODEL_DIR)
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model.eval()

manifest = []

for index, phrase in enumerate(PHRASES, 1):
    spoken = sayify(phrase)
    # Номи файл — sha1 аз матни талаффуз. Backend ҳамонро ҳисоб мекунад.
    name = hashlib.sha1(spoken.encode("utf-8")).hexdigest()

    inputs = tokenizer(spoken, return_tensors="pt")
    with torch.no_grad():
        output = model(**inputs).waveform

    wav_path = f"{OUT}/{name}.wav"
    sf.write(wav_path, output.squeeze().cpu().numpy(), model.config.sampling_rate)

    # mp3 сабуктар аст ва браузер онро якбора мехонад.
    mp3_path = f"{OUT}/{name}.mp3"
    os.system(f'ffmpeg -y -loglevel error -i "{wav_path}" -codec:a libmp3lame -q:a 4 "{mp3_path}"')
    os.remove(wav_path)

    size = os.path.getsize(mp3_path) // 1024
    manifest.append({"text": phrase, "spoken": spoken, "file": f"{name}.mp3"})
    print(f"{index:2}. {size:4} KB  {phrase[:50]}")

with open(f"{OUT}/manifest.json", "w", encoding="utf-8") as handle:
    json.dump(manifest, handle, ensure_ascii=False, indent=1)

shutil.make_archive("/content/ovozho", "zip", OUT)
print(f"\nТайёр: {len(manifest)} файл")

from google.colab import files
files.download("/content/ovozho.zip")
