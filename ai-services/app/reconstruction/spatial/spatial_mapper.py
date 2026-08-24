from typing import Any, Dict, List

from app.reconstruction.coordinates.coordinate_mapper import CoordinateMapper
from app.reconstruction.spatial.objects import create_spatial_object
from app.schemas.spatial_twin import SpatialObject


class SpatialMapper:
    """
    Converts vision detections into spatial objects
    for the 2D Digital Twin.
    """

    def __init__(self, coordinate_mapper: CoordinateMapper):
        self.coordinate_mapper = coordinate_mapper

    def map_detections(
        self,
        detections: List[Dict[str, Any]],
        frame_id: str,
    ) -> List[SpatialObject]:

        spatial_objects: List[SpatialObject] = []

        for index, detection in enumerate(detections):

            bounding_box = detection["bounding_box"]

            # Calculate center of the detection.
            center_x = (
                bounding_box["x_min"]
                + bounding_box["x_max"]
            ) / 2

            center_y = (
                bounding_box["y_min"]
                + bounding_box["y_max"]
            ) / 2

            # Convert image coordinates to
            # 2D polyhouse-local coordinates.
            x_m, y_m = self.coordinate_mapper.pixel_to_world(
                center_x,
                center_y,
            )

            # Create the SpatialObject using
            # the centralized object factory.
            spatial_object = create_spatial_object(
                object_id=f"{frame_id}-OBJ-{index + 1}",
                detection=detection,
                x_m=x_m,
                y_m=y_m,
                frame_id=frame_id,
            )

            spatial_objects.append(spatial_object)

        return spatial_objects