from fastapi import APIRouter

from app.schemas.requests import AnalyzeFrameRequest
from app.schemas.responses import APIResponse
from app.schemas.spatial_twin import SpatialTwinOutput


router = APIRouter(
    prefix="/api/v1/vision",
    tags=["Vision"]
)


@router.post("/analyze-frame", response_model=APIResponse)
def analyze_frame(request: AnalyzeFrameRequest):

    # Temporary response.
    # Later this will be replaced by:
    #
    # Image
    #   ↓
    # YOLO / Vision
    #   ↓
    # Spatial Reconstruction
    #   ↓
    # SpatialTwinOutput

    spatial_result = SpatialTwinOutput(
        mission_id=request.mission_id,
        polyhouse_id="PH-001",
        coordinate_system="polyhouse_local",
        objects=[],
        relationships=[]
    )

    return APIResponse(
        success=True,
        message="Frame received successfully",
        data=spatial_result
    )