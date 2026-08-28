from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ObjectType(str, Enum):
    STRUCTURE = "structure"
    ZONE = "zone"
    BED = "bed"
    CROP = "crop"
    SENSOR = "sensor"
    PIPE = "pipe"
    VALVE = "valve"
    EQUIPMENT = "equipment"


class RelationshipType(str, Enum):
    CONTAINS = "contains"
    INSIDE = "inside"
    BELONGS_TO = "belongs_to"
    CONNECTED_TO = "connected_to"
    NEAR = "near"


class SpatialPosition(BaseModel):
    x_m: float
    y_m: float
    z_m: float


class SpatialDimensions(BaseModel):
    width_m: float
    depth_m: float
    height_m: float


class SpatialOrientation(BaseModel):
    roll_deg: float = 0.0
    pitch_deg: float = 0.0
    yaw_deg: float = 0.0


class BoundingBox(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float


class SpatialObject(BaseModel):
    id: str
    type: ObjectType
    class_name: str
    crop_type: Optional[str] = None
    confidence: float = 1.0
    position: SpatialPosition
    dimensions: Optional[SpatialDimensions] = None
    orientation: Optional[SpatialOrientation] = None
    bounding_box: Optional[BoundingBox] = None
    health_score: Optional[float] = None
    health_status: Optional[str] = None
    plant_count: Optional[int] = None
    source_frames: List[str] = Field(default_factory=list)


class SpatialRelationship(BaseModel):
    source_id: str
    relation: RelationshipType
    target_id: str


class PolyhouseDimensions(BaseModel):
    length_m: float = 60.0
    width_m: float = 30.0
    height_m: float = 6.5


class DigitalTwinSummary(BaseModel):
    total_zones: int = 4
    total_beds: int = 48
    total_crops_detected: int = 0
    overall_health_score: float = 0.95
    polyhouse_dimensions: PolyhouseDimensions = Field(default_factory=PolyhouseDimensions)


class SpatialTwinOutput(BaseModel):
    mission_id: str
    polyhouse_id: str = "PH-001"
    coordinate_system: str = "polyhouse_local_2d"
    generated_at: Optional[str] = None
    summary: Optional[DigitalTwinSummary] = None
    objects: List[SpatialObject] = Field(default_factory=list)
    relationships: List[SpatialRelationship] = Field(default_factory=list)