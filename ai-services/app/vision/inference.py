from typing import Any, Dict, List

from app.reconstruction.coordinates.coordinate_mapper import CoordinateMapper
from app.reconstruction.spatial.builder import SpatialTwinBuilder
from app.reconstruction.spatial.relationships import build_relationships
from app.reconstruction.spatial.spatial_mapper import SpatialMapper
from app.schemas.spatial_twin import SpatialTwinOutput
from app.vision.detection.detector import ObjectDetector
from app.vision.detection.postprocess import postprocess_detections
from app.vision.preprocessing.image_loader import load_image_from_url


class VisionInference:
    """
    Orchestrates the complete Sahid vision pipeline.

    Image
        ↓
    YOLO detection
        ↓
    2D spatial mapping
        ↓
    Relationship detection
        ↓
    SpatialTwinOutput
    """

    def __init__(
        self,
        polyhouse_width_m: float = 12.0,
        polyhouse_length_m: float = 8.0,
    ):
        self.detector = ObjectDetector()

        self.polyhouse_width_m = polyhouse_width_m
        self.polyhouse_length_m = polyhouse_length_m

    async def analyze_image(
        self,
        image_url: str,
        image_width: int,
        image_height: int,
        mission_id: str = "MISSION-DEMO",
        polyhouse_id: str = "PH-DEMO",
        frame_id: str = "FRAME-DEMO",
    ) -> SpatialTwinOutput:

        # ----------------------------------------------------
        # 1. Load image
        # ----------------------------------------------------

        image = await load_image_from_url(image_url)

        # ----------------------------------------------------
        # 2. Run YOLO detection
        # ----------------------------------------------------

        results = self.detector.detect(image)

        # ----------------------------------------------------
        # 3. Convert YOLO output into clean detections
        # ----------------------------------------------------

        detections: List[Dict[str, Any]] = postprocess_detections(
            results
        )

        # ----------------------------------------------------
        # 4. Create coordinate mapper
        # ----------------------------------------------------

        coordinate_mapper = CoordinateMapper(
            image_width=image_width,
            image_height=image_height,
            polyhouse_width_m=self.polyhouse_width_m,
            polyhouse_length_m=self.polyhouse_length_m,
        )

        # ----------------------------------------------------
        # 5. Convert detections into SpatialObjects
        # ----------------------------------------------------

        spatial_mapper = SpatialMapper(
            coordinate_mapper=coordinate_mapper
        )

        objects = spatial_mapper.map_detections(
            detections=detections,
            frame_id=frame_id,
        )

        # ----------------------------------------------------
        # 6. Build spatial relationships
        # ----------------------------------------------------

        relationships = build_relationships(
            objects=objects
        )

        # ----------------------------------------------------
        # 7. Build final Digital Twin output
        # ----------------------------------------------------

        builder = SpatialTwinBuilder()

        spatial_twin = builder.build(
            mission_id=mission_id,
            polyhouse_id=polyhouse_id,
            objects=objects,
            relationships=relationships,
            coordinate_system="polyhouse_local_2d",
        )

        return spatial_twin