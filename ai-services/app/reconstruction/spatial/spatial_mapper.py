from typing import Any, Dict, List
from app.reconstruction.coordinates.coordinate_mapper import CoordinateMapper
from app.reconstruction.spatial.objects import create_spatial_object
from app.schemas.spatial_twin import ObjectType, SpatialObject


class SpatialMapper:
    """
    Transforms 2D image detections into 3D SpatialObjects using the 3D CoordinateMapper.
    """

    def __init__(self, coordinate_mapper: CoordinateMapper):
        self.coordinate_mapper = coordinate_mapper

    def map_detections(
        self,
        detections: List[Dict[str, Any]],
        frame_id: str,
        drone_x: float = 0.0,
        drone_y: float = 0.0,
        drone_z: float = 4.5,
        drone_yaw_deg: float = 90.0,
        gimbal_pitch_deg: float = -60.0,
        vari_metrics: Dict[str, Any] = None
    ) -> List[SpatialObject]:
        """
        Maps a list of image detections into 3D SpatialObjects.
        """
        objects: List[SpatialObject] = []
        crop_idx = 1
        bed_idx = 1

        health_score = vari_metrics.get("chlorophyll_score", 0.92) if vari_metrics else 0.92
        health_status = vari_metrics.get("health_status", "healthy") if vari_metrics else "healthy"

        for det in detections:
            center_u = det.get("center_u", self.coordinate_mapper.image_width / 2.0)
            center_v = det.get("center_v", self.coordinate_mapper.image_height / 2.0)

            # Georeference to 3D world plane
            x_m, y_m, z_m = self.coordinate_mapper.pixel_to_world(
                pixel_u=center_u,
                pixel_v=center_v,
                drone_x=drone_x,
                drone_y=drone_y,
                drone_z=drone_z,
                drone_yaw_deg=drone_yaw_deg,
                gimbal_pitch_deg=gimbal_pitch_deg,
                target_plane_z=0.25
            )

            class_name = det.get("class_name", "crop")
            if class_name in ("growing_bed", "bed"):
                object_id = f"BED-{bed_idx:03d}"
                bed_idx += 1
                plant_count = 8
            else:
                prefix = class_name[:3].upper() if len(class_name) >= 3 else "CRP"
                object_id = f"CROP-{prefix}-{crop_idx:03d}"
                crop_idx += 1
                plant_count = None

            obj = create_spatial_object(
                object_id=object_id,
                detection=det,
                x_m=x_m,
                y_m=y_m,
                z_m=z_m,
                frame_id=frame_id,
                health_score=health_score,
                health_status=health_status,
                plant_count=plant_count
            )
            objects.append(obj)

        return objects