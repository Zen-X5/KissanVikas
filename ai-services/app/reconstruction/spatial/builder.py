from typing import List

from app.schemas.spatial_twin import (
    SpatialObject,
    SpatialRelationship,
    SpatialTwinOutput,
)


class SpatialTwinBuilder:
    """
    Builds the final SpatialTwinOutput from
    reconstructed spatial objects and relationships.
    """

    def build(
        self,
        mission_id: str,
        polyhouse_id: str,
        objects: List[SpatialObject],
        relationships: List[SpatialRelationship],
        coordinate_system: str = "polyhouse_local_2d",
    ) -> SpatialTwinOutput:

        return SpatialTwinOutput(
            mission_id=mission_id,
            polyhouse_id=polyhouse_id,
            coordinate_system=coordinate_system,
            objects=objects,
            relationships=relationships,
        )