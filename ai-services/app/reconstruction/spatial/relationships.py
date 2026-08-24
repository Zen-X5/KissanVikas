from typing import List

from app.schemas.spatial_twin import (
    ObjectType,
    RelationshipType,
    SpatialObject,
    SpatialRelationship,
)


def build_relationships(
    objects: List[SpatialObject],
) -> List[SpatialRelationship]:
    """
    Build basic spatial relationships between objects.

    Current MVP relationships:
        crop -> belongs_to -> bed
        bed  -> inside    -> zone
        zone -> inside    -> polyhouse
    """

    relationships: List[SpatialRelationship] = []

    for source in objects:
        for target in objects:

            if source.id == target.id:
                continue

            # ------------------------------------------------
            # Crop belongs to the bed containing its position
            # ------------------------------------------------
            if (
                source.type == ObjectType.CROP
                and target.type == ObjectType.BED
                and _is_inside(source, target)
            ):
                relationships.append(
                    SpatialRelationship(
                        source_id=source.id,
                        relation=RelationshipType.BELONGS_TO,
                        target_id=target.id,
                    )
                )

            # ------------------------------------------------
            # Bed is inside a zone
            # ------------------------------------------------
            elif (
                source.type == ObjectType.BED
                and target.type == ObjectType.ZONE
                and _is_inside(source, target)
            ):
                relationships.append(
                    SpatialRelationship(
                        source_id=source.id,
                        relation=RelationshipType.INSIDE,
                        target_id=target.id,
                    )
                )

            # ------------------------------------------------
            # Zone is inside polyhouse
            # ------------------------------------------------
            elif (
                source.type == ObjectType.ZONE
                and target.type == ObjectType.STRUCTURE
                and target.class_name == "polyhouse"
                and _is_inside(source, target)
            ):
                relationships.append(
                    SpatialRelationship(
                        source_id=source.id,
                        relation=RelationshipType.INSIDE,
                        target_id=target.id,
                    )
                )

    return relationships


def _is_inside(
    source: SpatialObject,
    container: SpatialObject,
) -> bool:
    """
    Check whether the center of the source object
    lies inside the 2D bounds of the container.

    This is a simple MVP implementation.
    """

    if container.dimensions is None:
        return False

    source_x = source.position.x_m
    source_y = source.position.y_m

    container_x = container.position.x_m
    container_y = container.position.y_m

    half_width = container.dimensions.width_m / 2
    half_depth = container.dimensions.depth_m / 2

    min_x = container_x - half_width
    max_x = container_x + half_width

    min_y = container_y - half_depth
    max_y = container_y + half_depth

    return (
        min_x <= source_x <= max_x
        and
        min_y <= source_y <= max_y
    )