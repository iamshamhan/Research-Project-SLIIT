"""Step 1: just LOOK at what is inside the dataset folder."""
import collections
from config import RAW

exts = collections.Counter(p.suffix.lower() for p in RAW.rglob("*") if p.is_file())
print("File types:", exts.most_common())

tops = sorted(d for d in RAW.iterdir() if d.is_dir())
print(f"\n{len(tops)} top-level folders, first 10:", [d.name for d in tops[:10]])

print("\nFirst 15 files:")
for p in [p for p in RAW.rglob("*") if p.is_file()][:15]:
    print("  ", p.relative_to(RAW))
