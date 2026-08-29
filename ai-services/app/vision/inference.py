from typing import Any, Dict, List
from app.reconstruction.coordinates.coordinate_mapper import CoordinateMapper
from app.reconstruction.spatial.builder import SpatialTwinBuilder
from app.reconstruction.spatial.objects import determine_zone_and_crop
from app.reconstruction.spatial.spatial_mapper import SpatialMapper
from app.schemas.requests import AnalyzeFrameRequest
from app.schemas.spatial_twin import SpatialTwinOutput
from app.vision.detection.detector import ObjectDetector
from app.vision.detection.postprocess import postprocess_detections
from app.vision.preprocessing.image_loader import load_image_from_url_or_path
from app.vision.preprocessing.vari_analyzer import VARIAnalyzer


class VisionInference:
    """
    Complete AI & Computer Vision Pipeline Orchestrator:
    Drone Frame + Telemetry
        ↓
    Image Preprocessing & VARI Health Scoring
        ↓
    YOLO Object Detection
        ↓
    3D Ray-Plane Georeferencing (u, v → X, Y, Z)
        ↓
    Spatial Digital Twin Graph Construction
        ↓
    Standard SpatialTwinOutput JSON
    """

    def __init__(
        self,
        polyhouse_length_m: float = 60.0,
        polyhouse_width_m: float = 30.0,
        model_path: str = "yolo26n.pt",
    ):
        self.polyhouse_length_m = polyhouse_length_m
        self.polyhouse_width_m = polyhouse_width_m

        self.detector = ObjectDetector(model_path=model_path)
        self.vari_analyzer = VARIAnalyzer()
        self.builder = SpatialTwinBuilder()

    async def analyze_single_frame(
        self,
        request: AnalyzeFrameRequest,
        polyhouse_id: str = "PH-DEMO-001"
    ) -> SpatialTwinOutput:
        """Processes a single 1080p survey frame with drone pose."""
        # 1. Load image (URL / Local / Fallback)
        img = await load_image_from_url_or_path(
            request.image.url,
            default_width=request.image.width,
            default_height=request.image.height
        )

        # 2. VARI Canopy Health & Chlorophyll Analysis
        vari_metrics = self.vari_analyzer.analyze_canopy_health(img)

        # 3. Determine active zone & crop type based on drone position
        _, _, crop_hint = determine_zone_and_crop(
            request.drone_pose.position.x_m,
            request.drone_pose.position.y_m
        )

        # 4. Run YOLO Object Detection
        raw_results = self.detector.detect(img)
        detections = postprocess_detections(
            results=raw_results,
            image_width=request.image.width,
            image_height=request.image.height,
            crop_zone_hint=crop_hint
        )

        # 5. Georeference 2D Bounding Boxes to 3D Metric Coordinates
        coord_mapper = CoordinateMapper(
            image_width=request.image.width,
            image_height=request.image.height,
            fov_deg=request.camera.fov_deg,
            polyhouse_length_m=self.polyhouse_length_m,
            polyhouse_width_m=self.polyhouse_width_m,
        )

        spatial_mapper = SpatialMapper(coordinate_mapper=coord_mapper)
        spatial_objects = spatial_mapper.map_detections(
            detections=detections,
            frame_id=request.frame_id,
            drone_x=request.drone_pose.position.x_m,
            drone_y=request.drone_pose.position.y_m,
            drone_z=request.drone_pose.position.z_m,
            drone_yaw_deg=request.drone_pose.orientation.yaw_deg,
            gimbal_pitch_deg=request.camera.gimbal_pitch_deg,
            vari_metrics=vari_metrics
        )

        # 6. Build Final Spatial Digital Twin Output
        output = self.builder.build(
            mission_id=request.mission_id,
            polyhouse_id=polyhouse_id,
            objects=spatial_objects,
            coordinate_system="polyhouse_local_2d"
        )

        return output

    async def analyze_batch_mission(
        self,
        frames: List[AnalyzeFrameRequest],
        mission_id: str,
        polyhouse_id: str = "PH-DEMO-001"
    ) -> SpatialTwinOutput:
        """Processes an entire multi-frame survey mission and aggregates all beds & crops."""
        all_objects = []
        for req in frames:
            frame_output = await self.analyze_single_frame(req, polyhouse_id=polyhouse_id)
            # Collect beds and crops (excluding root polyhouse and zones to avoid duplicate roots)
            for obj in frame_output.objects:
                if obj.type.value in ("bed", "crop"):
                    all_objects.append(obj)

        return self.builder.build(
            mission_id=mission_id,
            polyhouse_id=polyhouse_id,
            objects=all_objects,
            coordinate_system="polyhouse_local_2d"
        )