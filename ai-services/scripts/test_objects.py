from app.reconstruction.spatial.objects import create_spatial_object


def main():

    detection = {
        "class_id": 0,
        "class_name": "crop",
        "confidence": 0.94,
        "bounding_box": {
            "x_min": 400,
            "y_min": 200,
            "x_max": 500,
            "y_max": 350,
        },
    }

    spatial_object = create_spatial_object(
        object_id="CROP-001",
        detection=detection,
        x_m=4.2,
        y_m=2.1,
        frame_id="F-000001",
    )

    print(spatial_object.model_dump())


if __name__ == "__main__":
    main()