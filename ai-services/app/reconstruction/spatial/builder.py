from datetime import datetime, timezone
from typing import List
from app.reconstruction.spatial.objects import get_default_dimensions
from app.reconstruction.spatial.relationships import build_relationships
from app.schemas.spatial_twin import (
    DigitalTwinSummary,
    ObjectType,
    PolyhouseDimensions,
    SpatialObject,
    SpatialPosition,
    SpatialRelationship,
    SpatialTwinOutput,
)


class SpatialTwinBuilder:
    """
    Constructs the complete hierarchical Polyhouse Spatial Digital Twin:
    - Root Polyhouse Structure
    - 4 Production Zones (Zone A: Tomato, Zone B: Capsicum, Zone C: Cucumber, Zone D: Eggplant)
    - Reconstructed Crop Beds
    - Detected Crop Plants
    - Topological Graph Relationships (contains, inside, belongs_to)
    - Summary Metrics
    """

    def build(
        self,
        mission_id: str,
        polyhouse_id: str = "PH-DEMO-001",
        objects: List[SpatialObject] = None,
        relationships: List[SpatialRelationship] = None,
        coordinate_system: str = "polyhouse_local_2d"
    ) -> SpatialTwinOutput:
        objects = list(objects) if objects else []

        # 1. Add Default Structure if not present
        if not any(o.type == ObjectType.STRUCTURE for o in objects):
            polyhouse_obj = SpatialObject(
                id="POLYHOUSE-001",
                type=ObjectType.STRUCTURE,
                class_name="polyhouse",
                confidence=1.0,
                position=SpatialPosition(x_m=0.0, y_m=0.0, z_m=0.0),
                dimensions=get_default_dimensions(ObjectType.STRUCTURE, "polyhouse"),
            )
            objects.insert(0, polyhouse_obj)

        # 2. Add the 4 Canonical Zones if not already in objects list
        zone_definitions = [
            ("ZONE-A", "Tomato Zone 01", "tomato", -15.0, 8.25),
            ("ZONE-B", "Capsicum Zone 01", "capsicum", 15.0, 8.25),
            ("ZONE-C", "Cucumber Zone 01", "cucumber", -15.0, -8.25),
            ("ZONE-D", "Eggplant Zone 01", "eggplant", 15.0, -8.25),
        ]
        for z_id, z_name, crop_type, z_x, z_y in zone_definitions:
            if not any(o.id == z_id for o in objects):
                zone_obj = SpatialObject(
                    id=z_id,
                    type=ObjectType.ZONE,
                    class_name="growing_zone",
                    crop_type=crop_type,
                    confidence=0.99,
                    position=SpatialPosition(x_m=z_x, y_m=z_y, z_m=0.0),
                    dimensions=get_default_dimensions(ObjectType.ZONE, "growing_zone"),
                )
                objects.append(zone_obj)

        # 3. Build/Update Topological Graph Relationships
        final_relationships = build_relationships(objects)
        if relationships:
            # Merge custom relationships if supplied
            existing_pairs = {(r.source_id, r.relation, r.target_id) for r in final_relationships}
            for r in relationships:
                if (r.source_id, r.relation, r.target_id) not in existing_pairs:
                    final_relationships.append(r)

        # 4. Compute Summary Statistics
        beds_count = len([o for o in objects if o.type == ObjectType.BED])
        crops_count = len([o for o in objects if o.type == ObjectType.CROP])
        zones_count = len([o for o in objects if o.type == ObjectType.ZONE])

        # Average health score across detected crops
        crop_scores = [o.health_score for o in objects if o.type == ObjectType.CROP and o.health_score is not None]
        avg_health = round(sum(crop_scores) / len(crop_scores), 2) if crop_scores else 0.94

        summary = DigitalTwinSummary(
            total_zones=zones_count,
            total_beds=beds_count,
            total_crops_detected=crops_count,
            overall_health_score=avg_health,
            polyhouse_dimensions=PolyhouseDimensions(length_m=60.0, width_m=30.0, height_m=6.5)
        )

        return SpatialTwinOutput(
            mission_id=mission_id,
            polyhouse_id=polyhouse_id,
            coordinate_system=coordinate_system,
            generated_at=datetime.now(timezone.utc).isoformat(),
            summary=summary,
            objects=objects,
            relationships=final_relationships,
        )