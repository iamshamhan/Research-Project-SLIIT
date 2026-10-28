"""setup: videos -> landmark .npy, ONLY for chosen glosses.
Each clip becomes an array (T, 75, 3):  rows 0-32 pose | 33-53 left hand | 54-74 right hand.
Missing hands are stored as zeros. Skip this script if SSL400 already gives you landmarks."""
import cv2, numpy as np, pandas as pd, mediapipe as mp
from pathlib import Path
from tqdm import tqdm
from config import *
import mediapipe as mp

try:
    mp_drawing = mp.solutions.drawing_utils
    mp_h = mp.solutions.holistic
except AttributeError:
    # Fallback for newer Python wheels where solutions are split/wrapped
    import mediapipe.python.solutions.drawing_utils as mp_drawing
    import mediapipe.python.solutions.holistic as mp_h

def to_arr(lms, n):
    if lms is None:
        return np.zeros((n, 3), np.float32)
    return np.array([[l.x, l.y, l.z] for l in lms.landmark], np.float32)

def extract(path):
    cap, frames = cv2.VideoCapture(str(path)), []
    with mp_h.Holistic(model_complexity=1, min_detection_confidence=0.5,
                       min_tracking_confidence=0.5) as h:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            r = h.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            frames.append(np.concatenate([to_arr(r.pose_landmarks, 33),
                                          to_arr(r.left_hand_landmarks, 21),
                                          to_arr(r.right_hand_landmarks, 21)]))
    cap.release()
    return np.stack(frames) if frames else None

manifest = pd.read_csv(MANIFEST)
chosen = set(pd.read_csv(CHOSEN)["gloss"])
is_video = manifest.path.map(lambda p: Path(p).suffix.lower() in VIDEO_EXT)
todo = manifest[manifest.gloss.isin(chosen) & is_video]
print(f"{len(todo)} videos to process")

for row in tqdm(todo.itertuples(), total=len(todo)):
    out = LMK / row.gloss / f"{Path(row.path).stem}.npy"
    if out.exists():
        continue
    arr = extract(row.path)
    if arr is None:
        print("could not read", row.path)
        continue
    out.parent.mkdir(parents=True, exist_ok=True)
    np.save(out, arr)
print("Done ->", LMK)
