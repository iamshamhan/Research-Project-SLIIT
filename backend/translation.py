"""Small offline glossary for testing Sinhala -> English independently of signs."""
import unicodedata

GLOSSARY = {
    'ආයුබෝවන්': 'Hello',
    'ස්තූතියි': 'Thank you',
    'ඔව්': 'Yes',
    'නැහැ': 'No',
}

def translate_sinhala(text: str):
    source = ' '.join(unicodedata.normalize('NFC', text).split())
    translated = GLOSSARY.get(source)
    return {'source_text': source, 'source_language': 'si', 'target_language': 'en',
            'text': translated, 'status': 'translated' if translated else 'unsupported',
            'method': 'offline_phrase_glossary'}
