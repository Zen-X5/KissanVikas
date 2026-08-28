from typing import List, Optional
from pydantic import BaseModel, Field


class Position(BaseModel):
    x_m: float
    y_m: float
    z_m: float


class Orientation(BaseModel):
    roll_deg: float = 0.0
    pitch_deg: float = 0.0
    yaw_deg: float = 0.0


class DronePose(BaseModel):
    position: Position
    orientation: Orientation = Field(default_factory=Orientation)


class CameraParameters(BaseModel):
    fov_deg: float = 78.0
    gimbal_pitch_deg: float = -60.0
    gimbal_yaw_deg: float = 0.0


class ImageInfo(BaseModel):
    url: str
    width: int = 1920
    height: int = 1080


class AnalyzeFrameRequest(BaseModel):
    mission_id: str
    drone_id: str = "DRONE-001"
    frame_id: str
    sequence_number: int = 1
    stage: str = "interior_scan"
    timestamp: Optional[str] = None
    image: ImageInfo
    drone_pose: DronePose
    camera: CameraParameters = Field(default_factory=CameraParameters)


class BatchAnalyzeRequest(BaseModel):
    mission_id: str
    polyhouse_id: str = "PH-DEMO-001"
    frames: List[AnalyzeFrameRequest]