import httpx
import numpy as np
import cv2#This function downloads an image from a URL and returns it as a NumPy array.


async def load_image_from_url(url: str) -> np.ndarray:
    async with httpx.AsyncClient() as client:
        response = await client.get(url)

    response.raise_for_status()

    image_bytes = np.frombuffer(response.content, dtype=np.uint8)

    image = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Unable to decode image")

    return image