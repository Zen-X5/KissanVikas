from typing import Any, Dict, Optional
from app.schemas.spatial_twin import (
    BoundingBox,
    ObjectType,
    SpatialDimensions,
    SpatialObject,
    SpatialOrientation,
    SpatialPosition,
)


def determine_zone_and_crop(x_m: float, y_m: float) -> tuple[str, str, str]:
    """
    Classifies polyhouse metric coordinates into Zone ID, Zone Name, and Crop Type.
    """
    if y_m >= 1.5:
        if x_m <= 0.0:
            return "ZONE-A", "Tomato Zone 01", "tomato"
        else:
            return "ZONE-B", "Capsicum Zone 01", "capsicum"
    elif y_m <= -1.5:
        if x_m <= 0.0:
            return "ZONE-C", "Cucumber Zone 01", "cucumber"
        else:
            return "ZONE-D", "Eggplant Zone 01", "eggplant"
    return "ZONE-CENTRAL", "Central Logistics Spine", "mixed"


def get_default_dimensions(object_type: ObjectType, class_name: str) -> Optional[SpatialDimensions]:
    """Returns standard metric dimensions for polyhouse objects."""
    if object_type == ObjectType.STRUCTURE:
        return SpatialDimensions(width_m=60.0, depth_m=30.0, height_m=6.5)
    elif object_type == ObjectType.ZONE:
        return SpatialDimensions(width_m=30.0, depth_m=13.5, height_m=4.5)
    elif object_type == ObjectType.BED:
        return SpatialDimensions(width_m=1.2, depth_m=11.5, height_m=0.25)
    elif object_type == ObjectType.CROP:
        if class_name in ("tomato", "cucumber"):
            return SpatialDimensions(width_m=0.35, depth_m=0.35, height_m=1.6)
        else:
            return SpatialDimensions(width_m=0.35, depth_m=0.35, height_m=0.9)
    return None


def create_spatial_object(
    object_id: str,
    detection: Dict[str, Any],
    x_m: float,
    y_m: float,
    z_m: float,
    frame_id: str,
    health_score: Optional[float] = None,
    health_status: Optional[str] = None,
    plant_count: Optional[int] = None
) -> SpatialObject:
    """Creates a standardized SpatialObject."""
    raw_class = detection.get("class_name", "crop")
    obj_type = map_object_type(raw_class)

    zone_id, _, crop_type = determine_zone_and_crop(x_m, y_m)
    final_crop_type = crop_type if obj_type in (ObjectType.CROP, ObjectType.BED) else None

    return SpatialObject(
        id=object_id,
        type=obj_type,
        class_name=raw_class,
        crop_type=final_crop_type,
        confidence=detection.get("confidence", 0.95),
        position=SpatialPosition(x_m=x_m, y_m=y_m, z_m=z_m),
        dimensions=get_default_dimensions(obj_type, raw_class),
        orientation=SpatialOrientation(roll_deg=0.0, pitch_deg=0.0, yaw_deg=0.0),
        bounding_box=detection.get("bounding_box"),
        health_score=health_score,
        health_status=health_status,
        plant_count=plant_count,
        source_frames=[frame_id] if frame_id else []
    )


def map_object_type(class_name: str) -> ObjectType:
    """Maps class names to standard ObjectType."""
    name = class_name.lower()
    if name in ("tomato", "capsicum", "cucumber", "eggplant", "crop", "plant"):
        return ObjectType.CROP
    if name in ("bed", "growing_bed", "crop_bed"):
        return ObjectType.BED
    if name in ("zone", "growing_zone"):
        return ObjectType.ZONE
    if name in ("polyhouse", "structure"):
        return ObjectType.STRUCTURE
    if name == "sensor":
        return ObjectType.SENSOR
    return ObjectType.EQUIPMENT