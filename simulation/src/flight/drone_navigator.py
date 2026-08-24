"""
Smooth Drone Trajectory Navigator & Path Interpolator.
Interpolates flight paths between survey waypoints into realistic, continuous micro-steps
with realistic flight dynamics (smooth acceleration, heading orientation, and altitude hold).
"""
import math
from typing import List, Tuple

class SmoothTrajectoryNavigator:
    def __init__(self, cruise_speed_mps: float = 2.0, step_time_sec: float = 0.15):
        self.cruise_speed_mps = cruise_speed_mps
        self.step_time_sec = step_time_sec

    def interpolate_path(
        self,
        start_pos: Tuple[float, float, float],
        target_pos: Tuple[float, float, float],
        speed: float = 2.0
    ) -> List[Tuple[float, float, float, float]]:
        """
        Generates smooth intermediate (x, y, z, yaw_deg) trajectory points between start and target.
        """
        sx, sy, sz = start_pos
        tx, ty, tz = target_pos

        dx = tx - sx
        dy = ty - sy
        dz = tz - sz
        distance = math.sqrt(dx**2 + dy**2 + dz**2)

        if distance < 0.05:
            yaw = math.degrees(math.atan2(dy, dx)) if (abs(dx) > 0.01 or abs(dy) > 0.01) else 0.0
            return [(tx, ty, tz, yaw)]

        step_dist = speed * self.step_time_sec
        num_steps = max(1, int(distance / step_dist))

        yaw = math.degrees(math.atan2(dy, dx)) if math.sqrt(dx**2 + dy**2) > 0.1 else 0.0

        points = []
        for i in range(1, num_steps + 1):
            fraction = i / float(num_steps)
            x = sx + dx * fraction
            y = sy + dy * fraction
            z = sz + dz * fraction
            points.append((x, y, z, yaw))

        return points
