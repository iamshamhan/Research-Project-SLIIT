"""Sentence List.
Each entry = (English meaning, [gloss, gloss, ...] in signing order).
!! These gloss names are PLACEHOLDERS. Open outputs/class_counts.csv, find the real
!! class names, then edit this list. Run 03_check_glosses.py to verify.
!! Check gloss ORDER for SLSL with your supervisors / the literature - do not assume English order.
"""
SENTENCES = [
    ("I need a doctor", ["I", "Help"]),
    ("Where is the hospital", ["House", "You"]),
    ("I have cold", ["I", "Cold"]),
    ("I need water", ["I", "Drink"]),
    ("Doctor, help me", ["Help", "I"]),
    ("Ayubowan I have cough", ["I", "Cough"]),
    ("Do you need help", ["You", "Help"]),
    ("Ayubowan I visit hospital yesterday", ["Ayubowan", "I", "Visit", "Yesterday"]),
]
