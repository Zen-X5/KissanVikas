import math
from typing import List
from app.schemas.spatial_twin import (
    ObjectType,
    RelationshipType,
    SpatialObject,
    SpatialRelationship,
)


def calculate_distance(obj_a: SpatialObject, obj_b: SpatialObject) -> float:
    """Computes Euclidean 2D ground distance between two spatial objects."""
    dx = obj_a.position.x_m - obj_b.position.x_m
    dy = obj_a.position.y_m - obj_b.position.y_m
    return math.sqrt(dx**2 + dy**2)


def build_relationships(objects: List[SpatialObject]) -> List[SpatialRelationship]:
    """
    Builds topological graph relationships between polyhouse entities:
    - Polyhouse contains Zones
    - Zones contain Beds (inside)
    - Beds contain Crops (belongs_to)
    """
    relationships: List[SpatialRelationship] = []

    structures = [o for o in objects if o.type == ObjectType.STRUCTURE]
    zones = [o for o in objects if o.type == ObjectType.ZONE]
    beds = [o for o in objects if o.type == ObjectType.BED]
    crops = [o for o in objects if o.type == ObjectType.CROP]

    main_structure = structures[0] if structures else None

    # 1. Structure contains Zones
    if main_structure:
        for z in zones:
            relationships.append(SpatialRelationship(
                source_id=main_structure.id,
                relation=RelationshipType.CONTAINS,
                target_id=z.id
            ))

    # 2. Beds inside Zones
    for b in beds:
        nearest_zone = None
        min_dist = float("inf")
        for z in zones:
            dist = calculate_distance(b, z)
            if dist < min_dist:
                min_dist = dist
                nearest_zone = z

        if nearest_zone:
            relationships.append(SpatialRelationship(
                source_id=b.id,
                relation=RelationshipType.INSIDE,
                target_id=nearest_zone.id
            ))

    # 3. Crops belong to Beds
    for c in crops:
        nearest_bed = None
        min_dist = float("inf")
        for b in beds:
            dist = calculate_distance(c, b)
            if dist < min_dist:
                min_dist = dist
                nearest_bed = b

        if nearest_bed:
            relationships.append(SpatialRelationship(
                source_id=c.id,
                relation=RelationshipType.BELONGS_TO,
                target_id=nearest_bed.id
            ))

    return relationships