import math
from typing import Optional, Tuple


class CoordinateMapper:
    """
    3D Ray-Plane Pinhole Georeferencing Engine.
    Transforms 2D image pixel coordinates (u, v) into metric 3D Polyhouse
    local world coordinates (X, Y, Z) using drone pose, gimbal orientation, and camera FOV.
    """

    def __init__(
        self,
        image_width: int = 1920,
        image_height: int = 1080,
        fov_deg: float = 78.0,
        polyhouse_length_m: float = 60.0,
        polyhouse_width_m: float = 30.0,
    ):
        self.image_width = max(1, image_width)
        self.image_height = max(1, image_height)
        self.fov_deg = fov_deg
        self.polyhouse_length_m = polyhouse_length_m
        self.polyhouse_width_m = polyhouse_width_m

        # Compute focal length in pixels based on horizontal FOV
        fov_rad = math.radians(self.fov_deg)
        self.focal_length_px = (self.image_width / 2.0) / math.tan(fov_rad / 2.0)

    def pixel_to_ray(self, pixel_u: float, pixel_v: float) -> Tuple[float, float, float]:
        """
        Computes normalized camera ray in camera frame.
        Convention: +X right, +Y down, +Z forward along optical axis.
        """
        cx = self.image_width / 2.0
        cy = self.image_height / 2.0

        x_c = (pixel_u - cx) / self.focal_length_px
        y_c = (pixel_v - cy) / self.focal_length_px
        z_c = 1.0

        norm = math.sqrt(x_c**2 + y_c**2 + z_c**2)
        return (x_c / norm, y_c / norm, z_c / norm)

    def pixel_to_world(
        self,
        pixel_u: float,
        pixel_v: float,
        drone_x: float = 0.0,
        drone_y: float = 0.0,
        drone_z: float = 4.5,
        drone_yaw_deg: float = 90.0,
        gimbal_pitch_deg: float = -60.0,
        target_plane_z: float = 0.25,
    ) -> Tuple[float, float, float]:
        """
        Projects a 2D image pixel onto the 3D target ground/bed plane (Z = target_plane_z).
        
        Returns:
            (x_m, y_m, z_m) inside Polyhouse metric coordinates.
        """
        # 1. Normalized optical ray in camera frame
        rx_c, ry_c, rz_c = self.pixel_to_ray(pixel_u, pixel_v)

        # 2. Camera to Drone body frame rotation (Gimbal pitch down)
        # Pitch is negative for looking downward
        pitch_rad = math.radians(abs(gimbal_pitch_deg))
        # Forward in drone frame = cos(pitch)*optical_Z - sin(pitch)*optical_Y
        # Downward in drone frame = - (sin(pitch)*optical_Z + cos(pitch)*optical_Y)
        r_fwd = math.cos(pitch_rad) * rz_c - math.sin(pitch_rad) * ry_c
        r_right = rx_c
        r_down = math.sin(pitch_rad) * rz_c + math.cos(pitch_rad) * ry_c

        # 3. Drone body to Polyhouse World frame rotation (Drone Yaw)
        yaw_rad = math.radians(drone_yaw_deg)
        cos_yaw = math.cos(yaw_rad)
        sin_yaw = math.sin(yaw_rad)

        # East / North conversion:
        # Heading 0 deg = +X, 90 deg = +Y
        dx_w = cos_yaw * r_fwd - sin_yaw * r_right
        dy_w = sin_yaw * r_fwd + cos_yaw * r_right
        dz_w = -r_down  # Negative down is -Z direction

        # 4. Ray-plane intersection with target plane Z = target_plane_z
        # Ray equation: P(t) = C + t * d
        if abs(dz_w) < 1e-6:
            # Parallel ray fallback
            t = drone_z / 1.0
        else:
            t = (target_plane_z - drone_z) / dz_w

        if t < 0:
            # Ray points away from ground; fallback to vertical projection
            t = abs(drone_z - target_plane_z)

        world_x = drone_x + t * dx_w
        world_y = drone_y + t * dy_w
        world_z = target_plane_z

        # Clamp within polyhouse boundaries (X: [-30, +30], Y: [-15, +15])
        max_x = self.polyhouse_length_m / 2.0
        max_y = self.polyhouse_width_m / 2.0
        clamped_x = max(-max_x, min(max_x, world_x))
        clamped_y = max(-max_y, min(max_y, world_y))

        return (round(clamped_x, 2), round(clamped_y, 2), round(world_z, 2))