"""
Waypoint Planner for KissanVikas Survey Drone.
Generates structured 3D survey flight paths:
1. Stage 1: PERIMETER_SCAN (Exterior polyhouse loop around 60m x 30m walls)
2. Stage 2: INTERIOR_SCAN (Systematic row-by-row serpentine flight over all 48 crop beds)
"""
from dataclasses import dataclass
from typing import List

@dataclass
class Waypoint:
    x: float
    y: float
    z: float
    speed: float = 1.8 # m/s
    heading_deg: float = 0.0
    stage: str = "perimeter_scan"
    capture_frame: bool = True

class WaypointPlanner:
    def __init__(
        self,
        polyhouse_length_m: float = 60.0,
        polyhouse_width_m: float = 30.0,
        perimeter_margin_m: float = 3.5,
        perimeter_altitude_m: float = 4.5,
        interior_altitude_m: float = 3.2,
    ):
        self.half_l = polyhouse_length_m / 2.0 # 30.0m
        self.half_w = polyhouse_width_m / 2.0 # 15.0m
        self.p_margin = perimeter_margin_m
        self.p_alt = perimeter_altitude_m
        self.int_alt = interior_altitude_m

    def generate_perimeter_waypoints(self) -> List[Waypoint]:
        """
        Stage 1: Fly around exterior perimeter of polyhouse to map boundaries.
        Start at pad (-33, 0) -> South-West -> South-East -> North-East -> North-West -> Return to front.
        """
        x_min = -self.half_l - self.p_margin # -33.5m
        x_max = self.half_l + self.p_margin  # +33.5m
        y_min = -self.half_w - self.p_margin # -18.5m
        y_max = self.half_w + self.p_margin  # +18.5m
        z = self.p_alt

        wps = []

        # 1. Takeoff to perimeter altitude
        wps.append(Waypoint(x=x_min, y=0.0, z=z, speed=1.2, heading_deg=0.0, stage="perimeter_scan", capture_frame=True))

        # 2. South-West Corner
        wps.append(Waypoint(x=x_min, y=-9.0, z=z, speed=1.8, heading_deg=-90.0, stage="perimeter_scan", capture_frame=True))
        wps.append(Waypoint(x=x_min, y=y_min, z=z, speed=1.8, heading_deg=-90.0, stage="perimeter_scan", capture_frame=True))

        # 3. South Perimeter Wall (West to East)
        for x in [-22.0, -11.0, 0.0, 11.0, 22.0, x_max]:
            wps.append(Waypoint(x=x, y=y_min, z=z, speed=2.0, heading_deg=0.0, stage="perimeter_scan", capture_frame=True))

        # 4. East Perimeter Wall (South to North)
        for y in [-9.0, 0.0, 9.0, y_max]:
            wps.append(Waypoint(x=x_max, y=y, z=z, speed=1.8, heading_deg=90.0, stage="perimeter_scan", capture_frame=True))

        # 5. North Perimeter Wall (East to West)
        for x in [22.0, 11.0, 0.0, -11.0, -22.0, x_min]:
            wps.append(Waypoint(x=x, y=y_max, z=z, speed=2.0, heading_deg=180.0, stage="perimeter_scan", capture_frame=True))

        # 6. West Perimeter Wall (North back to Front Pad)
        wps.append(Waypoint(x=x_min, y=9.0, z=z, speed=1.8, heading_deg=-90.0, stage="perimeter_scan", capture_frame=True))
        wps.append(Waypoint(x=x_min, y=0.0, z=z, speed=1.5, heading_deg=-90.0, stage="perimeter_scan", capture_frame=True))

        return wps

    def generate_interior_waypoints(self) -> List[Waypoint]:
        """
        Stage 2: Enter polyhouse and perform systematic row-by-row serpentine scans
        over each bed in Zone A (Tomato), Zone B (Capsicum), Zone D (Eggplant), and Zone C (Cucumber).
        """
        z = self.int_alt
        wps = []

        # 1. Entrance through Front Doorway (X = -30m, Y = 0m)
        wps.append(Waypoint(x=-29.0, y=0.0, z=z, speed=1.2, heading_deg=0.0, stage="interior_scan", capture_frame=True))

        # 2. North Production Zones: Rows Y = 3.5, 5.5, 7.5, 9.5, 11.5, 13.5m (Tomato & Capsicum)
        y_north_rows = [3.5, 5.5, 7.5, 9.5, 11.5, 13.5]
        go_east = True

        for y in y_north_rows:
            if go_east:
                # Fly from West beds (Tomato) to East beds (Capsicum)
                wps.append(Waypoint(x=-24.0, y=y, z=z, speed=1.8, heading_deg=0.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=-14.0, y=y, z=z, speed=1.8, heading_deg=0.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=0.0, y=y, z=z, speed=1.8, heading_deg=0.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=14.0, y=y, z=z, speed=1.8, heading_deg=0.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=24.0, y=y, z=z, speed=1.8, heading_deg=0.0, stage="interior_scan", capture_frame=True))
            else:
                # Fly from East beds (Capsicum) to West beds (Tomato)
                wps.append(Waypoint(x=24.0, y=y, z=z, speed=1.8, heading_deg=180.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=14.0, y=y, z=z, speed=1.8, heading_deg=180.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=0.0, y=y, z=z, speed=1.8, heading_deg=180.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=-14.0, y=y, z=z, speed=1.8, heading_deg=180.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=-24.0, y=y, z=z, speed=1.8, heading_deg=180.0, stage="interior_scan", capture_frame=True))
            go_east = not go_east

        # 3. Transition via Central Cross Walkway (X = 0m, Y = 0m) to South Section
        wps.append(Waypoint(x=0.0, y=0.0, z=z, speed=1.5, heading_deg=-90.0, stage="interior_scan", capture_frame=False))

        # 4. South Production Zones: Rows Y = -3.5, -5.5, -7.5, -9.5, -11.5, -13.5m (Cucumber & Eggplant)
        y_south_rows = [-3.5, -5.5, -7.5, -9.5, -11.5, -13.5]
        go_east = True

        for y in y_south_rows:
            if go_east:
                # Fly from West beds (Cucumber) to East beds (Eggplant)
                wps.append(Waypoint(x=-24.0, y=y, z=z, speed=1.8, heading_deg=0.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=-14.0, y=y, z=z, speed=1.8, heading_deg=0.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=0.0, y=y, z=z, speed=1.8, heading_deg=0.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=14.0, y=y, z=z, speed=1.8, heading_deg=0.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=24.0, y=y, z=z, speed=1.8, heading_deg=0.0, stage="interior_scan", capture_frame=True))
            else:
                # Fly from East beds (Eggplant) to West beds (Cucumber)
                wps.append(Waypoint(x=24.0, y=y, z=z, speed=1.8, heading_deg=180.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=14.0, y=y, z=z, speed=1.8, heading_deg=180.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=0.0, y=y, z=z, speed=1.8, heading_deg=180.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=-14.0, y=y, z=z, speed=1.8, heading_deg=180.0, stage="interior_scan", capture_frame=True))
                wps.append(Waypoint(x=-24.0, y=y, z=z, speed=1.8, heading_deg=180.0, stage="interior_scan", capture_frame=True))
            go_east = not go_east

        # 5. Return to Main Walkway & Exit Front Doorway
        wps.append(Waypoint(x=-28.0, y=0.0, z=z, speed=1.5, heading_deg=180.0, stage="interior_scan", capture_frame=True))
        wps.append(Waypoint(x=-33.0, y=0.0, z=self.p_alt, speed=1.2, heading_deg=180.0, stage="interior_scan", capture_frame=False))

        return wps
