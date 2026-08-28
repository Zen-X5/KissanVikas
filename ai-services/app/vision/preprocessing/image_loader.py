import os
from typing import Optional
import cv2
import httpx
import numpy as np


async def load_image_from_url_or_path(url_or_path: str, default_width: int = 1920, default_height: int = 1080) -> np.ndarray:
    """
    Loads an image from HTTP/HTTPS URL, Cloudinary, local disk file, or creates a fallback frame.
    """
    if not url_or_path:
        return _create_synthetic_frame(default_width, default_height)

    # 1. Local file path
    if os.path.exists(url_or_path):
        img = cv2.imread(url_or_path)
        if img is not None:
            return img

    # 2. HTTP / HTTPS URL (Cloudinary, local streamer)
    if url_or_path.startswith("http://") or url_or_path.startswith("https://"):
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=5.0) as client:
                response = await client.get(url_or_path)
                if response.status_code == 200:
                    image_bytes = np.frombuffer(response.content, dtype=np.uint8)
                    image = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)
                    if image is not None:
                        return image
        except Exception:
            pass

    # 3. Fallback synthetic representative frame
    return _create_synthetic_frame(default_width, default_height)


def _create_synthetic_frame(width: int = 1920, height: int = 1080) -> np.ndarray:
    """Creates a synthetic agricultural canopy frame for offline fallback."""
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    # Soil base (brown)
    frame[:] = (35, 45, 60)
    # Raised bed with green crops
    cv2.rectangle(frame, (150, 150), (width - 150, height - 150), (30, 130, 40), -1)
    # Leaf textures / dots
    for i in range(200, width - 200, 180):
        cv2.circle(frame, (i, height // 2), 65, (40, 180, 50), -1)
        cv2.circle(frame, (i + 40, height // 2 - 30), 25, (20, 20, 210), -1)
    return frame