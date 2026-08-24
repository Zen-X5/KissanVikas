from app.reconstruction.spatial.relationships import build_relationships
from app.schemas.spatial_twin import (
    ObjectType,
    SpatialDimensions,
    SpatialObject,
    SpatialPosition,
)


def main():

    polyhouse = SpatialObject(
        id="POLYHOUSE-001",
        type=ObjectType.STRUCTURE,
        class_name="polyhouse",
        confidence=1.0,
        position=SpatialPosition(
            x_m=6.0,
            y_m=4.0,
            z_m=0.0,
        ),
        dimensions=SpatialDimensions(
            width_m=12.0,
            depth_m=8.0,
            height_m=4.0,
        ),
    )

    zone = SpatialObject(
        id="ZONE-001",
        type=ObjectType.ZONE,
        class_name="growing_zone",
        confidence=0.98,
        position=SpatialPosition(
            x_m=3.0,
            y_m=4.0,
            z_m=0.0,
        ),
        dimensions=SpatialDimensions(
            width_m=5.0,
            depth_m=7.0,
            height_m=0.0,
        ),
    )

    bed = SpatialObject(
        id="BED-001",
        type=ObjectType.BED,
        class_name="growing_bed",
        confidence=0.97,
        position=SpatialPosition(
            x_m=3.0,
            y_m=4.0,
            z_m=0.0,
        ),
        dimensions=SpatialDimensions(
            width_m=1.2,
            depth_m=5.0,
            height_m=0.3,
        ),
    )

    crop = SpatialObject(
        id="CROP-001",
        type=ObjectType.CROP,
        class_name="crop",
        confidence=0.94,
        position=SpatialPosition(
            x_m=3.0,
            y_m=4.0,
            z_m=0.0,
    ),
    )

    objects = [
        polyhouse,
        zone,
        bed,
        crop,
    ]

    relationships = build_relationships(objects)

    for relationship in relationships:
        print(relationship.model_dump())


if __name__ == "__main__":
    main()