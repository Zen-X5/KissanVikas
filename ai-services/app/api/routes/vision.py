from fastapi import APIRouter
from app.schemas.requests import AnalyzeFrameRequest, BatchAnalyzeRequest
from app.schemas.spatial_twin import SpatialTwinOutput
from app.vision.inference import VisionInference

router = APIRouter(
    prefix="/vision",
    tags=["Vision & Spatial Intelligence"],
)

vision_inference = VisionInference(
    polyhouse_length_m=60.0,
    polyhouse_width_m=30.0,
    model_path="yolo26n.pt"
)


@router.post(
    "/analyze-frame",
    response_model=SpatialTwinOutput,
    summary="Analyze Single Survey Frame",
    description="Processes 1080p drone frame, detects crops/beds, computes VARI, and outputs georeferenced Digital Twin JSON."
)
async def analyze_frame(request: AnalyzeFrameRequest) -> SpatialTwinOutput:
    result = await vision_inference.analyze_single_frame(
        request=request,
        polyhouse_id="PH-DEMO-001"
    )
    return result


@router.post(
    "/analyze-batch",
    response_model=SpatialTwinOutput,
    summary="Analyze Complete Multi-Frame Survey Mission",
    description="Aggregates all frames from an interior drone scan into the complete 48-bed Polyhouse Digital Twin."
)
async def analyze_batch(request: BatchAnalyzeRequest) -> SpatialTwinOutput:
    result = await vision_inference.analyze_batch_mission(
        frames=request.frames,
        mission_id=request.mission_id,
        polyhouse_id=request.polyhouse_id
    )
    return result