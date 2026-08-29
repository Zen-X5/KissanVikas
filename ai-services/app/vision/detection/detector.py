import os
from typing import Any, List
import numpy as np


class ObjectDetector:
    """
    YOLO Multi-Crop & Polyhouse Structure Object Detector.
    Detects crops (Tomato, Capsicum, Cucumber, Eggplant), raised beds, and polyhouse structures.
    """

    def __init__(self, model_path: str = "yolo26n.pt"):
        self.model_path = model_path
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            from ultralytics import YOLO
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
            else:
                # Load base lightweight model or initialize
                self.model = YOLO("yolo11n.pt") if os.path.exists("yolo11n.pt") else None
        except Exception:
            self.model = None

    def detect(self, image: np.ndarray) -> Any:
        """Runs YOLO detection on the input BGR image."""
        if self.model is not None and image is not None:
            try:
                results = self.model(image, verbose=False)
                return results
            except Exception:
                pass
        return None