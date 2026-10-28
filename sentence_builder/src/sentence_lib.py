"""Day 2: the sentence-builder functions (trim -> fill -> normalise -> join -> smooth)."""
import numpy as np
from scipy.ndimage import gaussian_filter1d

LH, RH = slice(33, 54), slice(54, 75)     # hand blocks inside the 75 landmarks
L_SH, R_SH = 11, 12                       # shoulders (pose indices)
ARMS = [11, 12, 13, 14, 15, 16]           # shoulders, elbows, wrists

def trim_rest(a, thresh=0.15, pad=3, min_len=8):
    """Cut the still 'rest' frames at the start and end of a clip (uses arm speed)."""
    speed = np.linalg.norm(np.diff(a[:, ARMS, :2], axis=0), axis=2).mean(axis=1)
    speed = gaussian_filter1d(speed, 2)
    if speed.max() <= 0:
        return a
    active = np.where(speed > thresh * speed.max())[0]
    if len(active) == 0:
        return a
    s, e = max(active[0] - pad, 0), min(active[-1] + 1 + pad, len(a))
    return a[s:e] if e - s >= min_len else a

def fill_missing(a):
    """If a hand is not detected in some frames, fill the gap by straight-line interpolation."""
    a, t = a.copy(), np.arange(len(a))
    for sl in (LH, RH):
        miss = np.all(a[:, sl, :] == 0, axis=(1, 2))
        if miss.all() or not miss.any():
            continue
        for j in range(sl.start, sl.stop):
            for c in range(3):
                a[miss, j, c] = np.interp(t[miss], t[~miss], a[~miss, j, c])
    return a

def normalize(a):
    """Centre on the shoulders and divide by shoulder width, so all clips share one scale."""
    zero = [np.all(a[:, sl, :] == 0, axis=(1, 2)) for sl in (LH, RH)]
    ctr = (a[:, L_SH, :] + a[:, R_SH, :]) / 2
    scale = np.median(np.linalg.norm(a[:, L_SH, :2] - a[:, R_SH, :2], axis=1))
    scale = scale if scale > 1e-6 else 1.0
    out = (a - ctr[:, None, :]) / scale
    for m, sl in zip(zero, (LH, RH)):
        out[m, sl, :] = 0                 # keep 'no hand' as zeros
    return out.astype(np.float32)

def bridge(last, first, n):
    """n new frames that glide (cosine ease) from the last frame of word A to the first of word B."""
    last, first = last.copy(), first.copy()
    for sl in (LH, RH):                   # if one side has no hand, borrow the other side's
        if not last[sl].any():  last[sl] = first[sl]
        if not first[sl].any(): first[sl] = last[sl]
    w = (1 - np.cos(np.linspace(0, 1, n + 2)[1:-1] * np.pi)) / 2
    return (1 - w)[:, None, None] * last + w[:, None, None] * first

def smooth_joins(seq, centers, sigma, width):
    """Gaussian-smooth the whole sentence, but keep the smoothed version ONLY near the joins."""
    sm = gaussian_filter1d(seq, sigma=sigma, axis=0, mode="nearest")
    t = np.arange(len(seq))[:, None, None]
    w = np.zeros((len(seq), 1, 1))
    for c in centers:
        w = np.maximum(w, np.exp(-0.5 * ((t - c) / width) ** 2))
    return w * sm + (1 - w) * seq

def build_sentence(clips, n_trans=6, smooth=True, sigma=2.0, width=6.0, rest_thresh=0.15):
    """clips: list of (T,75,3) arrays in sentence order.  Returns (sentence_array, info)."""
    parts, joins, spans, pos = [], [], [], 0
    for i, raw in enumerate(clips):
        c = normalize(fill_missing(trim_rest(raw, thresh=rest_thresh)))
        if i > 0:
            joins.append((pos, pos + n_trans))
            if n_trans > 0:
                parts.append(bridge(parts[-1][-1], c[0], n_trans))
                pos += n_trans
        parts.append(c)
        spans.append((pos, pos + len(c)))
        pos += len(c)
    seq = np.concatenate(parts)
    centers = [(s + e - 1) / 2 for s, e in joins]
    if smooth and centers:
        seq = smooth_joins(seq, centers, sigma, width)
    return seq.astype(np.float32), {"joins": joins, "centers": centers, "spans": spans}
