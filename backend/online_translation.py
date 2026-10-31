"""Online text translation. Messages are sent to MyMemory, never stored here."""
import html
import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen

def translate_online(text: str, source: str):
    target = 'si' if source == 'en' else 'en'
    query = urlencode({'q': text, 'langpair': f'{source}|{target}'})
    request = Request('https://api.mymemory.translated.net/get?' + query,
                      headers={'User-Agent': 'SignBridge/0.1'})
    with urlopen(request, timeout=10) as response:
        data = json.load(response)
    if str(data.get('responseStatus')) != '200' or data.get('quotaFinished'):
        raise ValueError('Online translation unavailable or daily quota reached. Try again later.')
    translated = data.get('responseData', {}).get('translatedText')
    if not isinstance(translated, str) or not translated.strip():
        raise ValueError('The translation service returned no text.')
    return {'text': html.unescape(translated), 'source_language': source,
            'target_language': target, 'provider': 'MyMemory'}
