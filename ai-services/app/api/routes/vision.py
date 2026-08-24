from fastapi import APIRouter

from app.schemas.requests import AnalyzeFrameRequest
from app.schemas.spatial_twin import SpatialTwinOutput
from app.vision.inference import VisionInference


router = APIRouter(
    prefix="/vision",
    tags=["Vision"],
)


vision_inference = VisionInference(
    polyhouse_width_m=12.0,
    polyhouse_length_m=8.0,
)


@router.post(
    "/analyze-frame",
    response_model=SpatialTwinOutput,
)
async def analyze_frame(
    request: AnalyzeFrameRequest,
) -> SpatialTwinOutput:

    result = await vision_inference.analyze_image(
        image_url=request.image.url,
        image_width=request.image.width,
        image_height=request.image.height,
        mission_id=request.mission_id,
        polyhouse_id="PH-DEMO-001",
        frame_id=request.frame_id,
    )

    return result