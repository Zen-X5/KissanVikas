from typing import Any, Dict

from app.schemas.spatial_twin import (
    ObjectType,
    SpatialObject,
    SpatialPosition,
)


def create_spatial_object(
    object_id: str,
    detection: Dict[str, Any],
    x_m: float,
    y_m: float,
    frame_id: str,
) -> SpatialObject:
    """
    Create a SpatialObject from a processed vision detection.
    """

    return SpatialObject(
        id=object_id,

        type=map_object_type(
            detection["class_name"]
        ),

        class_name=detection["class_name"],

        confidence=detection["confidence"],

        position=SpatialPosition(
            x_m=x_m,
            y_m=y_m,
            z_m=0.0,
        ),

        bounding_box=detection.get("bounding_box"),

        source_frames=[frame_id],
    )


def map_object_type(class_name: str) -> ObjectType:
    """
    Convert a vision class into the broader
    SpatialTwin object type.
    """

    if class_name in {
        "crop",
        "tomato",
        "cucumber",
    }:
        return ObjectType.CROP

    if class_name in {
        "bed",
        "growing_bed",
    }:
        return ObjectType.BED

    if class_name in {
        "zone",
        "growing_zone",
    }:
        return ObjectType.ZONE

    if class_name in {
        "polyhouse",
        "polyhouse_structure",
    }:
        return ObjectType.STRUCTURE

    if class_name in {
        "sensor",
    }:
        return ObjectType.SENSOR

    if class_name in {
        "pipe",
    }:
        return ObjectType.PIPE

    if class_name in {
        "valve",
    }:
        return ObjectType.VALVE

    return ObjectType.EQUIPMENT