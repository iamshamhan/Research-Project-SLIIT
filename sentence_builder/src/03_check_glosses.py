"""Day 1: check every gloss in sentences_config.py exists in SSL400 and has enough clips."""
import difflib, pandas as pd
from config import *
from sentences_config import SENTENCES

counts = pd.read_csv(COUNTS).set_index("gloss")["clips"]
lookup = {g.lower(): g for g in counts.index if isinstance(g, str)}
used = sorted({g for _, seq in SENTENCES for g in seq})

rows, problems = [], 0
for g in used:
    real = lookup.get(g.lower())
    if real is None:
        close = [lookup[c] for c in difflib.get_close_matches(g.lower(), list(lookup), n=3, cutoff=0.5)]
        print(f"MISSING  {g:15s} -> did you mean {close}?")
        problems += 1
    else:
        n = int(counts[real])
        flag = "OK  " if n >= MIN_CLIPS_PER_GLOSS else "FEW "
        problems += n < MIN_CLIPS_PER_GLOSS
        print(f"{flag}     {g:15s} {n:4d} clips")
        rows.append({"gloss": real, "clips": n})

pd.DataFrame(rows).to_csv(CHOSEN, index=False)
print(f"\n{len(used)} glosses used, {problems} problem(s). Saved outputs/chosen_glosses.csv")
