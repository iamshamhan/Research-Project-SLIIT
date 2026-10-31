import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app

class OnlineTranslationTest(unittest.TestCase):
    def test_directions_and_validation(self):
        with TestClient(app) as client, patch('main.translate_online') as translate:
            translate.return_value = {'text': 'test', 'provider': 'MyMemory'}
            for source in ['si', 'en']:
                response = client.post('/translate/online', json={'text': 'Hello', 'source': source})
                self.assertEqual(response.status_code, 200)
                translate.assert_called_with('Hello', source)
            for data in [{'text':'', 'source':'en'}, {'text':'x', 'source':'xx'}, {'text':'අ'*200,'source':'si'}]:
                self.assertEqual(client.post('/translate/online', json=data).status_code,422)

    def test_provider_failure_is_explicit(self):
        with TestClient(app) as client, patch('main.translate_online', side_effect=TimeoutError()):
            self.assertEqual(client.post('/translate/online', json={'text':'Hello','source':'en'}).status_code,502)

if __name__ == '__main__':
    unittest.main()
