"""Day 3: pipeline diagram, smoothing before/after plot, generated-sentences table.
   python 05_figures.py --sentence S001 --join 1"""
import argparse, numpy as np, pandas as pd, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from config import *
from sentence_lib import build_sentence

ap = argparse.ArgumentParser()
ap.add_argument("--sentence", default="S001")
ap.add_argument("--join", type=int, default=1, help="1 = join between word 1 and 2")
ap.add_argument("--landmark", type=int, default=PLOT_LANDMARK)
ap.add_argument("--coord", type=int, default=PLOT_COORD)
a = ap.parse_args()
FIG.mkdir(parents=True, exist_ok=True)
labels = pd.read_csv(OUT / "labels.csv")
HARD = {**SMOOTH, "n_trans": 0, "smooth": False}     # "before": plain cut-and-paste

# ---------- 1. pipeline diagram ----------
steps = ["SSL400\nword clips", "MediaPipe Holistic\nlandmarks (75x3)", "Trim\nrest frames",
         "Normalise\n(shoulder-centred)", "Join in gloss\norder + bridge", "Smooth\nthe joins",
         "Sentence .npy\n+ labels.csv"]
fig, ax = plt.subplots(figsize=(16, 2.6)); ax.axis("off")
ax.set_xlim(0, 14.2); ax.set_ylim(0, 2)
for i, s in enumerate(steps):
    x = i * 2 + 0.1
    ax.add_patch(FancyBboxPatch((x, 0.5), 1.5, 1, boxstyle="round,pad=0.05", fc="#e8f0fe", ec="#1a4d8f"))
    ax.text(x + 0.75, 1.0, s, ha="center", va="center", fontsize=9)
    if i < len(steps) - 1:
        ax.annotate("", xy=(x + 2.05, 1.0), xytext=(x + 1.6, 1.0), arrowprops=dict(arrowstyle="->"))
plt.savefig(FIG / "pipeline_diagram.png", dpi=200, bbox_inches="tight"); plt.close()

# ---------- 2. smoothing before/after ----------
def rebuild(row, params):
    return build_sentence([np.load(p) for p in row.source_clips.split(";")], **params)

def jump(seq, join, lm, co):
    s, e = join
    lo, hi = max(s - 2, 0), min(e + 2, len(seq) - 1)
    return float(np.abs(np.diff(seq[lo:hi + 1, lm, co])).max())

hard_j, smooth_j = [], []
for row in labels.itertuples():
    sh, ih = rebuild(row, HARD); ss, is_ = rebuild(row, SMOOTH)
    hard_j += [jump(sh, j, a.landmark, a.coord) for j in ih["joins"]]
    smooth_j += [jump(ss, j, a.landmark, a.coord) for j in is_["joins"]]
print(f"Largest frame-to-frame jump at joins, averaged over {len(hard_j)} joins: "
      f"without smoothing = {np.mean(hard_j):.4f}, with smoothing = {np.mean(smooth_j):.4f}")

row = next(labels[labels.sentence_id == a.sentence].itertuples())
sh, ih = rebuild(row, HARD); ss, is_ = rebuild(row, SMOOTH)
k = a.join - 1
fig, axs = plt.subplots(2, 1, figsize=(9, 6), sharey=True)
for ax_, seq, info, title in ((axs[0], sh, ih, "Without smoothing (hard cut)"),
                              (axs[1], ss, is_, "With bridge + smoothing")):
    s, e = info["joins"][k]
    c = (s + e) / 2
    lo, hi = int(max(c - 30, 0)), int(min(c + 30, len(seq)))
    ax_.plot(range(lo, hi), seq[lo:hi, a.landmark, a.coord], marker="o", ms=3)
    ax_.axvspan(s - 0.5, (e if e > s else s + 1) - 0.5, color="orange", alpha=0.3, label="join")
    ax_.set_title(f"{title}   (max jump at join = {jump(seq, (s, e), a.landmark, a.coord):.3f})")
    ax_.set_ylabel(f"landmark {a.landmark}, coord {a.coord} (normalised)")
    ax_.legend(loc="upper right")
axs[1].set_xlabel("Frame")
fig.suptitle(f"{row.sentence_id}: '{row.text}' - join {a.join}")
plt.tight_layout()
plt.savefig(FIG / f"smoothing_before_after_{a.sentence}.png", dpi=200); plt.close()

# ---------- 3. generated sentences table ----------
cols = ["sentence_id", "text", "gloss_seq", "n_frames"]
fig, ax = plt.subplots(figsize=(11, 0.32 * len(labels) + 1)); ax.axis("off")
tbl = ax.table(cellText=labels[cols].values, colLabels=cols, loc="center",
               cellLoc="left", colWidths=[0.1, 0.3, 0.45, 0.1])
tbl.auto_set_font_size(False); tbl.set_fontsize(8); tbl.scale(1, 1.2)
plt.savefig(FIG / "generated_sentences_table.png", dpi=200, bbox_inches="tight"); plt.close()
print("Saved 3 figures in", FIG)
