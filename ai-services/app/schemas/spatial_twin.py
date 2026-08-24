from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class ObjectType(str, Enum):
    CROP = "crop"
    BED = "bed"
    ZONE = "zone"
    SENSOR = "sensor"
    PIPE = "pipe"
    VALVE = "valve"
    STRUCTURE = "structure"
    EQUIPMENT = "equipment"


class RelationshipType(str, Enum):
    BELONGS_TO = "belongs_to"
    INSIDE = "inside"
    CONTAINS = "contains"
    CONNECTED_TO = "connected_to"
    NEAR = "near"


# Represents where an object is physically located
# inside the polyhouse coordinate system.
class SpatialPosition(BaseModel):
    x_m: float
    y_m: float
    z_m: float


# Represents the physical size of an object
# inside the polyhouse.
class SpatialDimensions(BaseModel):
    width_m: float
    depth_m: float
    height_m: float


# Represents the physical rotation of an object.
class SpatialOrientation(BaseModel):
    roll_deg: float
    pitch_deg: float
    yaw_deg: float


# Represents the object's 2D location inside
# the original camera image.
class BoundingBox(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float


class SpatialObject(BaseModel):
    # Unique identifier for the object.
    id: str

    # Broad category of the object.
    type: ObjectType

    # Specific class detected by the vision model.
    # Example: tomato, cucumber, growing_bed.
    class_name: str

    # Confidence score produced by the AI model.
    confidence: float

    # Real-world position inside the polyhouse.
    position: SpatialPosition

    # Optional physical dimensions.
    dimensions: Optional[SpatialDimensions] = None

    # Optional physical orientation.
    orientation: Optional[SpatialOrientation] = None

    # Optional 2D bounding box from the source image.
    bounding_box: Optional[BoundingBox] = None

    # Drone frames in which this object was observed.
    source_frames: List[str] = Field(default_factory=list)


class SpatialRelationship(BaseModel):
    # Object from which the relationship originates.
    source_id: str

    # Relationship between the two objects.
    relation: RelationshipType

    # Object that the source is related to.
    target_id: str


class SpatialTwinOutput(BaseModel):
    # Drone survey mission that produced this result.
    mission_id: str

    # Polyhouse being reconstructed/analyzed.
    polyhouse_id: str

    # Coordinate system used by the spatial positions.
    # Example: "polyhouse_local"
    coordinate_system: str

    # All spatial objects detected/reconstructed.
    objects: List[SpatialObject]

    # Relationships between detected/reconstructed objects.
    relationships: List[SpatialRelationship]