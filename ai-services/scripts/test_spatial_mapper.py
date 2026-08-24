from app.reconstruction.coordinates.coordinate_mapper import CoordinateMapper
from app.reconstruction.spatial.spatial_mapper import SpatialMapper


def main():

    coordinate_mapper = CoordinateMapper(
        image_width=1920,
        image_height=1080,
        polyhouse_width_m=12.0,
        polyhouse_length_m=8.0,
    )

    spatial_mapper = SpatialMapper(coordinate_mapper)

    fake_detections = [
        {
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
    ]

    objects = spatial_mapper.map_detections(
        fake_detections,
        frame_id="F-000001",
    )

    for obj in objects:
        print(obj.model_dump())


if __name__ == "__main__":
    main()