"""Day 1: audit SSL400 -> manifest.csv, class_counts.csv, class_distribution.png
Assumes layout:  ssl400/<GLOSS>/<clip file>
If your layout is different, change the line marked  <-- GLOSS RULE."""
import pandas as pd, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from config import *

rows = []
for p in RAW.rglob("*"):
    if p.is_file() and p.suffix.lower() in (VIDEO_EXT | {".npy"}):
        rows.append({"path": str(p), "gloss": p.parent.name.strip()})   # <-- GLOSS RULE
df = pd.DataFrame(rows)
assert len(df), "No clips found - run 00_inspect.py and check RAW path in config.py"

MANIFEST.parent.mkdir(parents=True, exist_ok=True)
df.to_csv(MANIFEST, index=False)

counts = df.groupby("gloss").size().sort_values(ascending=False).rename("clips").reset_index()
counts.to_csv(COUNTS, index=False)

FIG.mkdir(parents=True, exist_ok=True)
fig, ax = plt.subplots(1, 2, figsize=(13, 4.5))
ax[0].bar(range(len(counts)), counts["clips"], width=1.0)
ax[0].set(title=f"SSL400 class distribution ({len(counts)} classes, {len(df)} clips)",
          xlabel="Classes (sorted by clip count)", ylabel="Clips per class")
ax[1].hist(counts["clips"], bins=20, edgecolor="white")
ax[1].set(title="How many classes have N clips?", xlabel="Clips per class", ylabel="Number of classes")
plt.tight_layout()
plt.savefig(FIG / "class_distribution.png", dpi=200)

c = counts["clips"]
print(f"Classes: {len(counts)} | Clips: {len(df)}")
print(f"Clips/class  min={c.min()}  median={c.median()}  max={c.max()}")
print(f"Classes with < {MIN_CLIPS_PER_GLOSS} clips: {(c < MIN_CLIPS_PER_GLOSS).sum()}")
print("Saved: manifest.csv, class_counts.csv, figures/class_distribution.png")
