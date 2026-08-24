from pathlib import Path

import numpy as np
from ultralytics import YOLO


# MODEL_PATH = Path("app/vision/detection/models/yolo11n.pt")   we will use it later after we trained the model
MODEL_PATH = "yolo26n.pt"

class ObjectDetector:
    # This class is responsible for detecting objects in the input image.
    def __init__(self):
        self.model = YOLO(MODEL_PATH)

    def detect(self, image: np.ndarray):
        results = self.model(image)

        return results