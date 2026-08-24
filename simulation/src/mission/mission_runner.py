"""
Autonomous Survey Mission Runner for KissanVikas Drone Simulator (Bitupan).
Executes the complete 2-stage survey (Perimeter Scan + Interior Crop Scan)
with smooth flight interpolation, live Gazebo 3D GUI updates, and contract-compliant telemetry and frames.
"""
import argparse
import math
import os
import sys
import time
from typing import Optional

# Ensure simulation root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.camera.frame_capture import FrameCaptureManager
from src.camera.live_streamer import LiveCameraStreamer
from src.communication.backend_client import BackendDataClient
from src.flight.drone_navigator import SmoothTrajectoryNavigator
from src.flight.waypoint_planner import WaypointPlanner, Waypoint

def determine_crop_zone(x: float, y: float) -> Optional[str]:
    """Classifies current drone coordinates into the respective crop zone."""
    if y > 1.5:
        return "tomato" if x < 0.0 else "capsicum"
    elif y < -1.5:
        return "cucumber" if x < 0.0 else "eggplant"
    return None

class SurveyMissionRunner:
    def __init__(
        self,
        mission_id: str = "66bc1234567890abcdef1234",
        drone_id: str = "DRONE-001",
        backend_url: str = "http://localhost:3000/api/v1",
        enable_http: bool = True,
        speed_multiplier: float = 1.0,
        enable_gui_window: bool = False,
        stream_port: int = 8080,
    ):
        self.mission_id = mission_id
        self.drone_id = drone_id
        self.speed_multiplier = max(0.1, speed_multiplier)

        self.client = BackendDataClient(backend_url=backend_url, enable_http=enable_http)
        self.camera_mgr = FrameCaptureManager()
        self.streamer = LiveCameraStreamer(port=stream_port, enable_gui_window=enable_gui_window)
        self.planner = WaypointPlanner()
        self.navigator = SmoothTrajectoryNavigator(step_time_sec=0.1)

        # Telemetry State Tracking
        self.cur_x = -33.5
        self.cur_y = 0.0
        self.cur_z = 0.1
        self.cur_heading = 0.0
        self.cur_speed = 0.0
        self.battery_percent = 99.8
        self.total_flight_dist = 0.0

        self.sequence_num = 1
        self.frames_in_stage = 0
        self.dist_since_last_frame = 0.0

    def _sync_gazebo_pose(self, x: float, y: float, z: float, yaw_deg: float):
        """Updates the 3D drone position in Gazebo GUI in real-time."""
        try:
            import subprocess
            yaw_rad = math.radians(yaw_deg)
            qz = math.sin(yaw_rad / 2.0)
            qw = math.cos(yaw_rad / 2.0)
            req_str = f'name: "survey_drone", position: {{x: {x:.2f}, y: {y:.2f}, z: {z:.2f}}}, orientation: {{z: {qz:.4f}, w: {qw:.4f}}}'
            cmd = [
                'gz', 'service',
                '-s', '/world/polyhouse_world/set_pose',
                '--reqtype', 'gz.msgs.Pose',
                '--reptype', 'gz.msgs.Boolean',
                '--timeout', '30',
                '--req', req_str
            ]
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass

    def _sleep(self, duration_sec: float):
        time.sleep(duration_sec / self.speed_multiplier)

    def _capture_and_send_frame(self, stage: str):
        """Captures survey frame, saves to disk, and dispatches payload to backend."""
        crop_zone = determine_crop_zone(self.cur_x, self.cur_y)
        frame_id = f"F-{self.sequence_num:06d}"
        img_url, w, h = self.camera_mgr.capture_frame(
            mission_id=self.mission_id,
            frame_id=frame_id,
            stage=stage,
            x_m=self.cur_x,
            y_m=self.cur_y,
            z_m=self.cur_z,
            heading_deg=self.cur_heading,
            crop_zone_hint=crop_zone
        )
        self.client.send_frame(
            mission_id=self.mission_id,
            drone_id=self.drone_id,
            frame_id=frame_id,
            sequence_number=self.sequence_num,
            stage=stage,
            image_url=img_url,
            width=w,
            height=h,
            x_m=self.cur_x,
            y_m=self.cur_y,
            z_m=self.cur_z,
            yaw_deg=self.cur_heading
        )
        self.sequence_num += 1
        self.frames_in_stage += 1
        self.dist_since_last_frame = 0.0
        zone_tag = f"[{crop_zone.upper()}]" if crop_zone else "[BOUNDARY]"
        print(f"  [FRAME CAPTURED] [{frame_id}] {zone_tag} at ({self.cur_x:.1f}m, {self.cur_y:.1f}m, {self.cur_z:.1f}m)")

    def _fly_smoothly(self, target_x: float, target_y: float, target_z: float, speed: float, stage: str, auto_capture: bool = True):
        """Smoothly moves the drone, pushes live stream frames, streams telemetry, and auto-captures frames."""
        micro_steps = self.navigator.interpolate_path(
            start_pos=(self.cur_x, self.cur_y, self.cur_z),
            target_pos=(target_x, target_y, target_z),
            speed=speed
        )

        last_telemetry_time = 0.0

        for step_x, step_y, step_z, heading in micro_steps:
            dx = step_x - self.cur_x
            dy = step_y - self.cur_y
            dz = step_z - self.cur_z
            step_distance = math.sqrt(dx**2 + dy**2 + dz**2)
            self.total_flight_dist += step_distance
            self.dist_since_last_frame += step_distance

            self.cur_x = step_x
            self.cur_y = step_y
            self.cur_z = step_z
            self.cur_heading = heading
            self.cur_speed = speed
            self.battery_percent = max(5.0, self.battery_percent - 0.005)

            # Update Gazebo 3D GUI
            self._sync_gazebo_pose(self.cur_x, self.cur_y, self.cur_z, self.cur_heading)

            # Update Live Video Stream Buffer
            crop_zone = determine_crop_zone(self.cur_x, self.cur_y)
            self.streamer.render_and_publish_frame(
                mission_id=self.mission_id,
                stage=stage,
                x_m=self.cur_x,
                y_m=self.cur_y,
                z_m=self.cur_z,
                heading_deg=self.cur_heading,
                speed_mps=self.cur_speed,
                battery_percent=self.battery_percent,
                crop_zone=crop_zone
            )

            # Stream Telemetry at 250ms rate
            now = time.time()
            if now - last_telemetry_time >= (0.25 / self.speed_multiplier):
                self.client.send_telemetry(
                    mission_id=self.mission_id,
                    drone_id=self.drone_id,
                    stage=stage,
                    x_m=self.cur_x,
                    y_m=self.cur_y,
                    z_m=self.cur_z,
                    speed_mps=self.cur_speed,
                    heading_deg=self.cur_heading,
                    battery_percent=self.battery_percent
                )
                last_telemetry_time = now

            # Automatic Continuous Frame Capture (Every 3.0m in Perimeter, Every 2.2m in Interior)
            capture_interval = 3.0 if stage == "perimeter_scan" else 2.2
            if auto_capture and self.dist_since_last_frame >= capture_interval:
                self._capture_and_send_frame(stage=stage)

            self._sleep(0.08)

    def run_mission(self):
        print(f"\n=======================================================")
        print(f"[MISSION START] KISSANVIKAS DRONE SURVEY MISSION: {self.mission_id}")
        print(f"=======================================================\n")

        # Start live video streamer (HTTP MJPEG on port 8080)
        self.streamer.start()

        # ----------------------------------------------------
        # 1. EVENT: TAKEOFF
        # ----------------------------------------------------
        self.client.send_takeoff(self.mission_id, self.drone_id)
        print("[TAKEOFF] Drone ascending from pad to survey altitude (4.5m)...")
        self._fly_smoothly(self.cur_x, self.cur_y, 4.5, speed=1.2, stage="perimeter_scan", auto_capture=False)

        # ----------------------------------------------------
        # 2. STAGE 1: PERIMETER SCAN (Exterior Polyhouse Loop)
        # ----------------------------------------------------
        print("\n-------------------------------------------------------")
        print("[STAGE 1 START] PERIMETER SCAN (Flying Outer 60m x 30m Polyhouse Loop)")
        print("-------------------------------------------------------")
        self.client.send_perimeter_scan_started(self.mission_id, self.drone_id)

        perimeter_wps = self.planner.generate_perimeter_waypoints()
        stage1_start_time = time.time()
        stage1_start_dist = self.total_flight_dist
        self.frames_in_stage = 0

        for wp in perimeter_wps:
            self._fly_smoothly(wp.x, wp.y, wp.z, speed=wp.speed, stage="perimeter_scan", auto_capture=True)

        stage1_duration = int(time.time() - stage1_start_time)
        stage1_distance = self.total_flight_dist - stage1_start_dist

        self.client.send_perimeter_scan_completed(
            mission_id=self.mission_id,
            drone_id=self.drone_id,
            frames_captured=self.frames_in_stage,
            flight_distance_m=stage1_distance,
            duration_seconds=stage1_duration
        )
        print(f"[STAGE 1 DONE] PERIMETER SCAN COMPLETED! Frames: {self.frames_in_stage}, Distance: {stage1_distance:.1f}m")

        # ----------------------------------------------------
        # 3. STAGE 2: INTERIOR SCAN (Serpentine Crop Bed Coverage)
        # ----------------------------------------------------
        print("\n-------------------------------------------------------")
        print("[STAGE 2 START] INTERIOR SCAN (Entering Polyhouse & Scanning Crop Rows)")
        print("-------------------------------------------------------")
        self.client.send_interior_scan_started(self.mission_id, self.drone_id)

        interior_wps = self.planner.generate_interior_waypoints()
        stage2_start_time = time.time()
        stage2_start_dist = self.total_flight_dist
        self.frames_in_stage = 0

        for wp in interior_wps:
            self._fly_smoothly(wp.x, wp.y, wp.z, speed=wp.speed, stage="interior_scan", auto_capture=True)

        stage2_duration = int(time.time() - stage2_start_time)
        stage2_distance = self.total_flight_dist - stage2_start_dist

        self.client.send_interior_scan_completed(
            mission_id=self.mission_id,
            drone_id=self.drone_id,
            frames_captured=self.frames_in_stage,
            flight_distance_m=stage2_distance,
            duration_seconds=stage2_duration
        )
        print(f"[STAGE 2 DONE] INTERIOR SCAN COMPLETED! Frames: {self.frames_in_stage}, Distance: {stage2_distance:.1f}m")

        # ----------------------------------------------------
        # 4. EVENT: LANDING
        # ----------------------------------------------------
        print("\n-------------------------------------------------------")
        print("[LANDING] Returning to Pad & Descending...")
        print("-------------------------------------------------------")
        self.client.send_landing(self.mission_id, self.drone_id)

        # Smooth touchdown on pad
        self._fly_smoothly(-33.5, 0.0, 0.1, speed=1.0, stage="landing", auto_capture=False)
        self.client.send_landed(self.mission_id, self.drone_id)
        print("[LANDED] Drone Touchdown on Landing Pad Completed.")

        # ----------------------------------------------------
        # 5. EVENT: MISSION COMPLETED
        # ----------------------------------------------------
        total_frames = self.sequence_num - 1
        coverage_percent = 97.2

        self.client.send_mission_completed(
            mission_id=self.mission_id,
            drone_id=self.drone_id,
            frames_captured=total_frames,
            flight_distance_m=self.total_flight_dist,
            coverage_percent=coverage_percent
        )

        self.streamer.stop()

        print("\n=======================================================")
        print("[SUCCESS] MISSION COMPLETED!")
        print(f"Total Frames Captured: {total_frames}")
        print(f"Total Flight Distance: {self.total_flight_dist:.1f} meters")
        print(f"Remaining Battery: {self.battery_percent:.1f}%")
        print(f"Survey Coverage: {coverage_percent:.1f}%")
        print("=======================================================\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="KissanVikas Survey Drone Autonomous Mission Runner")
    parser.add_argument("--mission-id", default="66bc1234567890abcdef1234", help="Mission ID")
    parser.add_argument("--drone-id", default="DRONE-001", help="Drone ID")
    parser.add_argument("--backend-url", default="http://localhost:3000/api/v1", help="Backend API Base URL")
    parser.add_argument("--speed", type=float, default=1.0, help="Simulation speed multiplier")
    parser.add_argument("--view-camera", action="store_true", help="Open local OpenCV desktop FPV window")
    parser.add_argument("--port", type=int, default=8080, help="Live camera MJPEG stream port")
    parser.add_argument("--no-http", action="store_true", help="Disable HTTP dispatch (local console mode)")

    args = parser.parse_args()

    runner = SurveyMissionRunner(
        mission_id=args.mission_id,
        drone_id=args.drone_id,
        backend_url=args.backend_url,
        enable_http=not args.no_http,
        speed_multiplier=args.speed,
        enable_gui_window=args.view_camera,
        stream_port=args.port
    )
    runner.run_mission()
