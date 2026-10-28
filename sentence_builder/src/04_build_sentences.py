"""Day 2/3: build sentence .npy files + labels.csv.   python 04_build_sentences.py --n 30"""
import argparse, numpy as np, pandas as pd
from config import *
from sentence_lib import build_sentence
from sentences_config import SENTENCES

ap = argparse.ArgumentParser()
ap.add_argument("--n", type=int, default=30, help="how many sentences to generate")
n = ap.parse_args().n

rng = np.random.default_rng(SEED)
clips = {d.name.lower(): sorted(d.glob("*.npy")) for d in LMK.iterdir() if d.is_dir()}
(OUT / "npy").mkdir(parents=True, exist_ok=True)

rows = []
for i in range(n):
    text, seq = SENTENCES[i % len(SENTENCES)]
    picked = [clips[g.lower()][rng.integers(len(clips[g.lower()]))] for g in seq]
    arr, info = build_sentence([np.load(p) for p in picked], **SMOOTH)
    sid = f"S{i + 1:03d}"
    np.save(OUT / "npy" / f"{sid}.npy", arr)
    rows.append({
        "sentence_id": sid, "file": f"npy/{sid}.npy", "text": text,
        "gloss_seq": " ".join(seq), "n_gloss": len(seq), "n_frames": len(arr),
        "join_frames": ";".join(f"{s}-{e}" for s, e in info["joins"]),
        "source_clips": ";".join(str(p) for p in picked),
    })
    print(sid, text, arr.shape)

pd.DataFrame(rows).to_csv(OUT / "labels.csv", index=False)
print(f"\nSaved {n} sentences + labels.csv in {OUT}")
