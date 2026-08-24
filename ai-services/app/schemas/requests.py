from pydantic import BaseModel
from typing import Optional


class Position(BaseModel):
    x_m: float
    y_m: float
    z_m: float


class Orientation(BaseModel):
    roll_deg: float   #roll  deg means tilting left and right
    pitch_deg: float  #Pitch deg means up and down rotation
    yaw_deg: float    #Roll deg means left and right  rotation


class DronePose(BaseModel):
    position: Position
    orientation: Orientation


class CameraParameters(BaseModel):
    fov_deg: float      #Field of view:It means how wide the camera can see.
    gimbal_pitch_deg: float #This tells us how much the camera is pointing up/down.Important: this is the camera, not the drone.
    gimbal_yaw_deg: float #This tells us how much the camera is pointing left/right.Important: this is the camera, not the drone.

class ImageInfo(BaseModel):
    url: str
    width: int
    height: int


class AnalyzeFrameRequest(BaseModel):
    mission_id: str
    frame_id: str
    sequence_number: int
    stage: str
    timestamp: str

    image: ImageInfo

    drone_pose: DronePose

    camera: CameraParameters