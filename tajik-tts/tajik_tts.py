import re
import numpy as np
import torch
import soundfile as sf
from transformers import VitsModel, AutoTokenizer

class TajikTTS:
    def __init__(self, model_dir="model", device=None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = VitsModel.from_pretrained(model_dir).to(self.device).eval()
        self.tok = AutoTokenizer.from_pretrained(model_dir)
        self.sr = self.model.config.sampling_rate

    @staticmethod
    def split(text, max_len=160):
        parts = re.findall(r"[^.!?…]+[.!?…]*", text.strip())
        out = []
        for p in (x.strip() for x in parts if x.strip()):
            while len(p) > max_len:
                cut = p.rfind(",", 0, max_len)
                cut = cut if cut > 20 else p.rfind(" ", 0, max_len)
                cut = cut if cut > 0 else max_len
                out.append(p[:cut + 1].strip()); p = p[cut + 1:].strip()
            if p: out.append(p)
        return out

    def speak(self, text, speed=1.0, pause=0.35, seed=1):
        self.model.speaking_rate = speed
        gap = np.zeros(int(self.sr * pause), dtype=np.float32)
        chunks = []
        for s in self.split(text):
            ids = self.tok(s, return_tensors="pt").to(self.device)
            if ids["input_ids"].shape[1] < 2:
                continue
            torch.manual_seed(seed)
            with torch.no_grad():
                w = self.model(**ids).waveform[0].cpu().numpy().astype(np.float32)
            chunks += [w, gap]
        return np.concatenate(chunks) if chunks else np.zeros(1, dtype=np.float32)

    def save(self, text, path="output.wav", **kw):
        sf.write(path, self.speak(text, **kw), self.sr)
        return path
