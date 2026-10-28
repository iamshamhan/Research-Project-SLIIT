"""Run with python -m unittest test_pipeline after installing httpx."""
import unittest
import cv2
import numpy as np
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
from main import app
from pipeline import TemporalPipeline

class PipelineTest(unittest.TestCase):
    def test_sinhala_to_english_is_separate_and_explicit(self):
        with TestClient(app) as client:
            known = client.post('/translate/sinhala-to-english', json={'text': ' ආයුබෝවන් '}).json()
            self.assertEqual(known['text'], 'Hello')
            self.assertEqual(known['source_language'], 'si')
            self.assertEqual(known['method'], 'offline_phrase_glossary')
            unknown = client.post('/translate/sinhala-to-english', json={'text': 'unknown sentence'}).json()
            self.assertEqual(unknown['status'], 'unsupported')
            self.assertIsNone(unknown['text'])
            self.assertEqual(client.post('/translate/sinhala-to-english', json={'text': ''}).status_code, 422)

    def test_window_stride_order_and_reset(self):
        class FixtureModel:
            feature_spec = 'holistic-543-xyz-v0'
            def __init__(self): self.inputs = []
            def predict(self, window):
                self.inputs.append(window)
                return {'fixture': True}
        model = FixtureModel()
        pipeline = TemporalPipeline(window_size=3, stride=2, model=model)
        for frame_id in range(5):
            groups = {name: [[frame_id, 0, 0]] * count for name, count in
                      [('pose', 33), ('left_hand', 21), ('right_hand', 21), ('face', 468)]}
            result = pipeline.push(groups)
            self.assertEqual(result['window_ready'], frame_id in (2, 4))
        self.assertEqual(result['windows_completed'], 2)
        self.assertEqual(model.inputs[-1].shape, (3, 1629))
        np.testing.assert_array_equal(model.inputs[-1][:, 0], [2, 3, 4])
        self.assertEqual(len(pipeline.frames), 3)
        self.assertEqual(TemporalPipeline().total, 0)

    def test_health_and_landmark_contract(self):
        with TestClient(app) as client:
            self.assertFalse(client.get('/health').json()['model_loaded'])
            with client.websocket_connect('/ws/landmarks', headers={'origin': 'http://127.0.0.1:3000'}) as ws:
                ws.send_text('not binary')
                self.assertIn('error', ws.receive_json())
                ws.send_bytes(b'')
                self.assertIn('error', ws.receive_json())
                ws.send_bytes(b'not jpeg')
                self.assertIn('error', ws.receive_json())
                ok, frame = cv2.imencode('.jpg', np.zeros((480, 640, 3), dtype=np.uint8))
                self.assertTrue(ok)
                ws.send_bytes(frame.tobytes())
                result = ws.receive_json()
                self.assertEqual(sum(len(points) for points in result['landmarks'].values()), 543)
                self.assertTrue(all(len(point) == 3 for points in result['landmarks'].values() for point in points))
                self.assertFalse(any(result['detected'].values()))
                self.assertIsNone(result['prediction'])
                self.assertGreater(result['processing_ms'], 0)

    def test_untrusted_origin_rejected(self):
        with TestClient(app) as client:
            with self.assertRaises(WebSocketDisconnect):
                with client.websocket_connect('/ws/landmarks', headers={'origin': 'https://example.com'}):
                    self.fail('Unexpected accepted origin')

if __name__ == '__main__':
    unittest.main()
