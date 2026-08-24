from typing import List, Dict, Any


def postprocess_detections(results) -> List[Dict[str, Any]]:
    detections = []

    for result in results:
        boxes = result.boxes

        for box in boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            x_min, y_min, x_max, y_max = box.xyxy[0].tolist()

            class_name = result.names[class_id]

            detections.append(
                {
                    "class_id": class_id,
                    "class_name": class_name,
                    "confidence": confidence,
                    "bounding_box": {
                        "x_min": x_min,
                        "y_min": y_min,
                        "x_max": x_max,
                        "y_max": y_max,
                    },
                }
            )

    return detections