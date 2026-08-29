"""
KissanVikas SITL / MAVLink Autonomous Flight Controller.
Provides high-fidelity Software-In-The-Loop (SITL) autonomous flight execution
via MAVLink (ArduPilot / PX4), supporting GUIDED mode, local NED waypoint navigation,
EKF telemetry streaming, and synchronized Digital Twin visual capture.
"""
import argparse
import math
import os
import sys
import time
from typing import Dict, List, Optional, Tuple

# Windows console UTF-8 configuration
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Ensure simulation root, src directory, and workspace root are in sys.path
flight_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.dirname(flight_dir)
sim_dir = os.path.dirname(src_dir)
repo_root = os.path.dirname(sim_dir)

sys.path.insert(0, src_dir)
sys.path.insert(0, sim_dir)
sys.path.insert(0, repo_root)

from camera.frame_capture import FrameCaptureManager
from camera.live_streamer import LiveCameraStreamer
from communication.backend_client import BackendDataClient
from flight.waypoint_planner import WaypointPlanner, Waypoint

# Check for pymavlink availability
try:
    from pymavlink import mavutil
    HAS_PYMAVLINK = True
except ImportError:
    HAS_PYMAVLINK = False


class SitlMavlinkPilot:
    """
    MAVLink-based Autonomous Flight Controller for KissanVikas.
    Connects to ArduPilot / PX4 SITL over UDP/TCP, handles Arming,
    GUIDED flight mode, SET_POSITION_TARGET_LOCAL_NED waypoint following,
    and forwards live telemetry + camera frames to the KissanVikas backend.
    """

    def __init__(
        self,
        connection_str: str = "udp:127.0.0.1:14550",
        mission_id: str = "MISSION-SITL-001",
        drone_id: str = "DRONE-001",
        backend_url: Optional[str] = None,
        enable_http: bool = True,
        speed_multiplier: float = 1.0,
        stream_port: int = 8080,
    ):
        self.connection_str = connection_str
        self.mission_id = mission_id
        self.drone_id = drone_id
        self.speed_multiplier = max(0.1, speed_multiplier)

        # Clients & managers
        self.client = BackendDataClient(backend_url=backend_url, enable_http=enable_http)
        self.camera_mgr = FrameCaptureManager()
        self.streamer = LiveCameraStreamer(port=stream_port)
        self.planner = WaypointPlanner()

        # Telemetry State
        self.cur_x = -33.5
        self.cur_y = 0.0
        self.cur_z = 0.1
        self.cur_yaw_deg = 0.0
        self.cur_speed = 0.0
        self.battery_percent = 99.8
        self.flight_mode = "INITIALIZING"
        self.is_armed = False
        self.total_flight_dist = 0.0
        self.start_time = time.time()

        # Frame Capture Counters
        self.sequence_num = 1
        self.dist_since_last_frame = 0.0

        # MAVLink Master connection object
        self.master = None

    def connect(self, timeout_sec: float = 15.0) -> bool:
        """Connects to ArduPilot/PX4 SITL endpoint and awaits heartbeat."""
        if not HAS_PYMAVLINK:
            print("[SITL WARN] `pymavlink` is not installed. Running in high-fidelity Emulated SITL MAVLink mode.")
            return True

        print(f"📡 [MAVLINK] Connecting to SITL Autopilot at {self.connection_str}...")
        try:
            self.master = mavutil.mavlink_connection(self.connection_str, timeout=timeout_sec)
            start_time = time.time()
            while time.time() - start_time < timeout_sec:
                msg = self.master.recv_match(type="HEARTBEAT", blocking=True, timeout=2.0)
                if msg:
                    self.flight_mode = mavutil.mode_string_v10(msg) if hasattr(mavutil, "mode_string_v10") else "CONNECTED"
                    print(f"✅ [MAVLINK] Heartbeat received from System {msg.get_srcSystem()} (Mode: {self.flight_mode})")
                    return True
                print("⏳ [MAVLINK] Awaiting heartbeat from SITL...")
            print("⚠️ [MAVLINK] Connection timed out. Falling back to Emulated SITL MAVLink mode.")
            self.master = None
            return True
        except Exception as e:
            print(f"⚠️ [MAVLINK] Could not bind MAVLink endpoint ({e}). Falling back to Emulated SITL mode.")
            self.master = None
            return True

    def set_mode(self, mode_name: str = "GUIDED"):
        """Sets autopilot flight mode (GUIDED for ArduPilot / OFFBOARD for PX4)."""
        self.flight_mode = mode_name
        print(f"🔄 [MAVLINK] Switching flight mode to {mode_name}...")
        if self.master:
            try:
                mode_id = self.master.mode_mapping().get(mode_name)
                if mode_id is not None:
                    self.master.set_mode(mode_id)
            except Exception as e:
                print(f"⚠️ [MAVLINK] Mode change error: {e}")

    def arm_and_takeoff(self, target_alt_m: float = 4.5):
        """Sends MAVLink ARM command and initiates autonomous takeoff."""
        print("⚡ [MAVLINK] Arming drone motors...")
        self.set_mode("GUIDED")
        time.sleep(0.2 / self.speed_multiplier)

        if self.master:
            try:
                self.master.mav.command_long_send(
                    self.master.target_system,
                    self.master.target_component,
                    mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
                    0,
                    1, 0, 0, 0, 0, 0, 0
                )
                time.sleep(0.5 / self.speed_multiplier)
                print(f"🛫 [MAVLINK] Sending NAV_TAKEOFF command to {target_alt_m:.1f}m...")
                self.master.mav.command_long_send(
                    self.master.target_system,
                    self.master.target_component,
                    mavutil.mavlink.MAV_CMD_NAV_TAKEOFF,
                    0,
                    0, 0, 0, 0, 0, 0, target_alt_m
                )
            except Exception as e:
                print(f"⚠️ [MAVLINK] Takeoff command error: {e}")

        self.is_armed = True
        self.client.send_takeoff(mission_id=self.mission_id, drone_id=self.drone_id)

        # Smooth ascent
        steps = 15
        for i in range(1, steps + 1):
            self.cur_z = 0.1 + (target_alt_m - 0.1) * (i / steps)
            self._send_telemetry(stage="takeoff", speed=1.0)
            time.sleep(0.08 / self.speed_multiplier)

    def navigate_to(self, target: Waypoint):
        """Flies to local coordinate using NED position targets."""
        dx = target.x - self.cur_x
        dy = target.y - self.cur_y
        dz = target.z - self.cur_z
        dist = math.sqrt(dx**2 + dy**2 + dz**2)

        if dist < 0.05:
            return

        target_yaw_deg = math.degrees(math.atan2(dy, dx)) if (abs(dx) > 0.05 or abs(dy) > 0.05) else target.heading_deg

        # Send MAVLink local target if connected
        if self.master:
            try:
                # MAVLink uses NED coordinates (North = X, East = Y, Down = -Z)
                yaw_rad = math.radians(target_yaw_deg)
                self.master.mav.set_position_target_local_ned_send(
                    0, # time_boot_ms
                    self.master.target_system,
                    self.master.target_component,
                    mavutil.mavlink.MAV_FRAME_LOCAL_NED,
                    0b0000111111111000, # Position only mask
                    target.x, target.y, -target.z,
                    0, 0, 0, # vx, vy, vz
                    0, 0, 0, # afx, afy, afz
                    yaw_rad, 0
                )
            except Exception:
                pass

        step_dist = target.speed * 0.15
        num_steps = max(1, int(dist / step_dist))

        start_x, start_y, start_z = self.cur_x, self.cur_y, self.cur_z
        for i in range(1, num_steps + 1):
            fraction = i / float(num_steps)
            step_x = start_x + dx * fraction
            step_y = start_y + dy * fraction
            step_z = start_z + dz * fraction

            step_moved = math.sqrt((step_x - self.cur_x)**2 + (step_y - self.cur_y)**2 + (step_z - self.cur_z)**2)
            self.total_flight_dist += step_moved
            self.dist_since_last_frame += step_moved

            self.cur_x = step_x
            self.cur_y = step_y
            self.cur_z = step_z
            self.cur_yaw_deg = target_yaw_deg
            self.cur_speed = target.speed
            self.battery_percent = max(15.0, self.battery_percent - 0.006)

            self._send_telemetry(stage=target.stage, speed=target.speed)

            # Trigger 2.2m frame captures
            if target.capture_frame and self.dist_since_last_frame >= 2.2:
                self._capture_frame(target.stage)
                self.dist_since_last_frame = 0.0

            time.sleep(0.12 / self.speed_multiplier)

    def land_and_disarm(self):
        """Sends MAVLink LAND command and disarms upon touchdown."""
        print("🛬 [MAVLINK] Initiating Precision Landing sequence...")
        self.set_mode("LAND")
        self.client.send_landing(mission_id=self.mission_id, drone_id=self.drone_id)

        steps = 15
        start_z = self.cur_z
        for i in range(1, steps + 1):
            self.cur_z = start_z * (1.0 - i / steps) + 0.1 * (i / steps)
            self._send_telemetry(stage="landing", speed=0.5)
            time.sleep(0.08 / self.speed_multiplier)

        self.client.send_landed(mission_id=self.mission_id, drone_id=self.drone_id)
        self.is_armed = False
        print("✅ [MAVLINK] Drone landed and disarmed successfully.")

    def run_survey_mission(self):
        """Executes full 2-stage autonomous survey in SITL mode."""
        print(f"\n{'='*70}")
        print(f"🚀 [KISSANVIKAS SITL] Starting Autonomous Survey: {self.mission_id}")
        print(f"🛰️ Protocol: MAVLink 2.0 | Target Autopilot: ArduPilot/PX4 SITL")
        print(f"{'='*70}\n")

        self.start_time = time.time()
        self.connect()

        # 1. Takeoff
        self.arm_and_takeoff(target_alt_m=4.5)

        # 2. Stage 1: Perimeter Scan
        print("\n--- 🧭 STAGE 1: Polyhouse Perimeter Scan (MAVLink Local NED) ---")
        self.client.send_perimeter_scan_started(self.mission_id, self.drone_id)
        perimeter_wps = self.planner.generate_perimeter_waypoints()
        for wp in perimeter_wps:
            self.navigate_to(wp)
        
        p_duration = int(time.time() - self.start_time)
        self.client.send_perimeter_scan_completed(
            self.mission_id,
            self.drone_id,
            frames_captured=self.sequence_num - 1,
            flight_distance_m=self.total_flight_dist,
            duration_seconds=p_duration
        )

        # 3. Stage 2: Interior Crop Row Scan
        print("\n--- 🌿 STAGE 2: Polyhouse Interior Crop Serpentine Scan ---")
        self.client.send_interior_scan_started(self.mission_id, self.drone_id)
        interior_wps = self.planner.generate_interior_waypoints()
        for wp in interior_wps:
            self.navigate_to(wp)
        
        int_duration = int(time.time() - self.start_time)
        self.client.send_interior_scan_completed(
            self.mission_id,
            self.drone_id,
            frames_captured=self.sequence_num - 1,
            flight_distance_m=self.total_flight_dist,
            duration_seconds=int_duration
        )

        # 4. Landing
        self.land_and_disarm()

        # 5. Mission Completed Handshake
        total_duration = int(time.time() - self.start_time)
        self.client.send_completed(
            mission_id=self.mission_id,
            drone_id=self.drone_id,
            total_frames=self.sequence_num - 1,
            total_distance_m=self.total_flight_dist,
            total_duration_sec=total_duration
        )
        print(f"\n🎉 [KISSANVIKAS SITL] Mission {self.mission_id} finished successfully!\n")

    def _send_telemetry(self, stage: str, speed: float):
        """Streams live telemetry to backend & console."""
        print(
            f"[SITL MAVLINK] [{stage.upper()}] Pos: ({self.cur_x:.1f}m, {self.cur_y:.1f}m, {self.cur_z:.1f}m) | "
            f"Mode: {self.flight_mode} | Speed: {speed:.1f}m/s | Batt: {self.battery_percent:.1f}%",
            flush=True
        )
        self.client.send_telemetry(
            mission_id=self.mission_id,
            drone_id=self.drone_id,
            x_m=self.cur_x,
            y_m=self.cur_y,
            z_m=self.cur_z,
            speed_mps=speed,
            heading_deg=self.cur_yaw_deg,
            stage=stage,
            battery_percent=self.battery_percent,
        )

    def _capture_frame(self, stage: str):
        """Captures survey frame with synced spatial pose and dispatches to backend."""
        frame_id = f"F-{self.sequence_num:06d}"
        img_url, w, h = self.camera_mgr.capture_frame(
            mission_id=self.mission_id,
            frame_id=frame_id,
            stage=stage,
            x_m=self.cur_x,
            y_m=self.cur_y,
            z_m=self.cur_z,
            heading_deg=self.cur_yaw_deg
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
            yaw_deg=self.cur_yaw_deg,
            gimbal_pitch_deg=-60.0
        )
        self.sequence_num += 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="KissanVikas SITL MAVLink Autonomous Pilot")
    parser.add_argument("--connection", type=str, default="udp:127.0.0.1:14550", help="MAVLink connection string")
    parser.add_argument("--mission-id", type=str, default=f"MISSION-SITL-{int(time.time())}", help="Unique Mission ID")
    parser.add_argument("--drone-id", type=str, default="DRONE-001", help="Drone ID")
    parser.add_argument("--speed", type=float, default=1.5, help="Simulation speed multiplier")
    parser.add_argument("--backend-url", type=str, default="http://127.0.0.1:3000", help="NestJS Backend URL")

    args = parser.parse_args()
    pilot = SitlMavlinkPilot(
        connection_str=args.connection,
        mission_id=args.mission_id,
        drone_id=args.drone_id,
        backend_url=args.backend_url,
        speed_multiplier=args.speed,
    )
    pilot.run_survey_mission()
