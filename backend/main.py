"""Component C: local JPEG -> Holistic landmarks. No recognition model yet."""
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
import cv2
import mediapipe as mp
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pipeline import TemporalPipeline
from translation import translate_sinhala

app = FastAPI(title="SignBridge local inference")
app.add_middleware(CORSMiddleware,
    allow_origins=['http://127.0.0.1:3000', 'http://localhost:3000'],
    allow_methods=['GET', 'POST'], allow_headers=['Content-Type'])

class TranslationRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)

@app.post('/translate/sinhala-to-english')
def translate(request: TranslationRequest):
    return translate_sinhala(request.text)

@app.get('/health')
def health():
    return {"status": "ok", "mode": "landmarks_only", "model_loaded": False,
            "feature_spec": "holistic-543-xyz-v0"}

def pack(group, size):
    if group is None:
        return [[0.0, 0.0, 0.0] for _ in range(size)]
    return [[point.x, point.y, point.z] for point in group.landmark]

class FrameProcessor:
    """Own all tracker operations on a single session worker thread."""
    def __init__(self):
        self.tracker = mp.solutions.holistic.Holistic(model_complexity=0, refine_face_landmarks=False)
        self.pipeline = TemporalPipeline()

    def process(self, raw):
        started = time.perf_counter()
        if not raw:
            return {"error": "Expected a 640x480 JPEG frame"}
        try:
            frame = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
        except cv2.error:
            frame = None
        if frame is None or frame.shape[:2] != (480, 640):
            return {"error": "Expected a 640x480 JPEG frame"}
        result = self.tracker.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        raw_groups = {"pose": (result.pose_landmarks, 33),
                      "left_hand": (result.left_hand_landmarks, 21),
                      "right_hand": (result.right_hand_landmarks, 21),
                      "face": (result.face_landmarks, 468)}
        groups = {name: pack(group, count) for name, (group, count) in raw_groups.items()}
        temporal = self.pipeline.push(groups)
        return {"schema_version": 1, "feature_spec": "holistic-543-xyz-v0",
                "landmarks": groups,
                "detected": {name: group is not None for name, (group, _) in raw_groups.items()},
                "processing_ms": round((time.perf_counter() - started) * 1000, 2),
                "mode": "landmarks_only", "prediction": temporal.pop('prediction'),
                "temporal": temporal}

    def close(self):
        self.tracker.close()

@app.websocket('/ws/landmarks')
async def landmarks(ws: WebSocket):
    if ws.headers.get('origin') not in {'http://127.0.0.1:3000', 'http://localhost:3000'}:
        await ws.close(code=1008)
        return
    await ws.accept()
    # A worker per session keeps CPU processing off the service event loop.
    executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix='signbridge')
    loop = asyncio.get_running_loop()
    processor = None
    try:
        processor = await loop.run_in_executor(executor, FrameProcessor)
        while True:
            message = await ws.receive()
            if message['type'] == 'websocket.disconnect':
                break
            raw = message.get('bytes')
            if raw is None:
                await ws.send_json({"error": "Expected binary JPEG data"})
                continue
            if len(raw) > 1_000_000:
                await ws.close(code=1009)
                break
            response = await loop.run_in_executor(executor, processor.process, raw)
            await ws.send_json(response)
    except WebSocketDisconnect:
        pass
    finally:
        if processor is not None:
            await loop.run_in_executor(executor, processor.close)
        executor.shutdown(wait=False)
