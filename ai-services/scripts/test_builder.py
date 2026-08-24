from app.reconstruction.spatial.builder import SpatialTwinBuilder
from app.schemas.spatial_twin import (
    ObjectType,
    SpatialObject,
    SpatialPosition,
    SpatialRelationship,
    RelationshipType,
)


def main():

    # Fake spatial object
    crop = SpatialObject(
        id="CROP-001",
        type=ObjectType.CROP,
        class_name="crop",
        confidence=0.94,
        position=SpatialPosition(
            x_m=4.2,
            y_m=2.1,
            z_m=0.0,
        ),
        source_frames=["F-000001"],
    )

    # Fake relationship
    relationship = SpatialRelationship(
        source_id="CROP-001",
        relation=RelationshipType.BELONGS_TO,
        target_id="BED-001",
    )

    builder = SpatialTwinBuilder()

    twin = builder.build(
        mission_id="MISSION-001",
        polyhouse_id="PH-001",
        objects=[crop],
        relationships=[relationship],
    )

    print(twin.model_dump_json(indent=2))


if __name__ == "__main__":
    main()