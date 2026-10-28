from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "ssl400"        # unzipped Kaggle dataset
LMK = ROOT / "data" / "landmarks"             # data/landmarks/<GLOSS>/<clip>.npy
OUT = ROOT / "data" / "sentences"             # data/sentences/npy/*.npy + labels.csv
FIG = ROOT / "outputs" / "figures"
MANIFEST = ROOT / "outputs" / "manifest.csv"
COUNTS = ROOT / "outputs" / "class_counts.csv"
CHOSEN = ROOT / "outputs" / "chosen_glosses.csv"

VIDEO_EXT = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
MIN_CLIPS_PER_GLOSS = 5
SEED = 42

# Sentence-builder settings (Day 2)
SMOOTH = dict(
    n_trans=6,         # bridge frames inserted between two words
    smooth=True,       # smooth around each join
    sigma=2.0,         # strength of the Gaussian smoothing
    width=6.0,         # how many frames either side of a join get smoothed
    rest_thresh=0.15,  # frame is "rest" if arm speed < 15% of the clip's peak speed
)

# Which landmark to plot on Day 3 (pose index 16 = right wrist, coord 0 = x)
PLOT_LANDMARK = 16
PLOT_COORD = 0
