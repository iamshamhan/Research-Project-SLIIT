"""Bounded temporal window and explicit boundary for Component B's model.

The default window/stride are prototype settings, not a training specification.
No predictions are synthesized when the trained model is absent.
"""
from collections import deque
from typing import Protocol
import numpy as np

FEATURE_SPEC = 'holistic-543-xyz-v0'
GROUPS = ('pose', 'left_hand', 'right_hand', 'face')

class ModelAdapter(Protocol):
    feature_spec: str

    def predict(self, window: np.ndarray) -> dict:
        """Receive float32 [time, 1629]; return model-specific decoded result."""
        ...

class TemporalPipeline:
    def __init__(self, window_size=30, stride=15, model: ModelAdapter | None = None):
        if window_size < 1 or not 1 <= stride <= window_size:
            raise ValueError('Require window_size >= stride >= 1')
        if model and model.feature_spec != FEATURE_SPEC:
            raise ValueError('Model preprocessing specification does not match')
        self.frames = deque(maxlen=window_size)
        self.window_size = window_size
        self.stride = stride
        self.model = model
        self.total = 0
        self.windows = 0

    def push(self, groups):
        vector = np.asarray([point for name in GROUPS for point in groups[name]], dtype=np.float32).reshape(-1)
        if vector.shape != (1629,) or not np.isfinite(vector).all():
            raise ValueError('Expected 543 finite xyz landmarks')
        self.frames.append(vector)
        self.total += 1
        ready = self.total >= self.window_size and (self.total - self.window_size) % self.stride == 0
        prediction = None
        if ready:
            self.windows += 1
            if self.model is not None:
                prediction = self.model.predict(np.stack(self.frames))
        return {'buffered_frames': len(self.frames), 'window_size': self.window_size,
                'stride': self.stride, 'windows_completed': self.windows,
                'window_ready': ready, 'model_loaded': self.model is not None,
                'prediction': prediction}
