"""
KissanVikas Direct Visual Flight & Digital Twin Generator.
Moves the drone visually through Stage 1 (Perimeter) and Stage 2 (Interior Crop Rows),
displays camera frames, streams live telemetry to backend, and exports the Digital Twin JSON.
"""
import json
import math
import os
import subprocess
import sys
import time
from datetime import datetime, timezone

# Console encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

flight_dir = os.path.dirname(os.path.abspath(__file__))
sim_src_dir = os.path.dirname(flight_dir)
sim_dir = os.path.dirname(sim_src_dir)
repo_root = os.path.dirname(sim_dir)

sys.path.insert(0, sim_src_dir)
sys.path.insert(0, sim_dir)
sys.path.insert(0, repo_root)

from camera.frame_capture import FrameCaptureManager
from camera.live_streamer import LiveCameraStreamer
from communication.backend_client import BackendDataClient

def determine_crop_zone(x: float, y: float) -> str:
    """Classifies current drone coordinates into crop zone."""
    if y > 1.5:
        return "tomato" if x < 0.0 else "capsicum"
    elif y < -1.5:
        return "cucumber" if x < 0.0 else "eggplant"
    return "boundary"

def move_gazebo(x: float, y: float, z: float, yaw_deg: float = 0.0):
    """Teleports drone in Gazebo Harmonic."""
    yaw_rad = math.radians(yaw_deg)
    qz = math.sin(yaw_rad / 2.0)
    qw = math.cos(yaw_rad / 2.0)
    pose_str = f'name: "survey_drone", position: {{x: {x:.3f}, y: {y:.3f}, z: {z:.3f}}}, orientation: {{x: 0.0, y: 0.0, z: {qz:.4f}, w: {qw:.4f}}}'
    
    # 1. Try Gazebo Service
    cmd = [
        'gz', 'service',
        '-s', '/world/polyhouse_world/set_pose',
        '--reqtype', 'gz.msgs.Pose',
        '--reptype', 'gz.msgs.Boolean',
        '--timeout', '500',
        '--req', pose_str
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=0.6)
    except Exception:
        pass


def run_direct_survey(speed_mult: float = 2.0):
    mission_id = f"MISSION-{int(time.time())}"
    drone_id = "DRONE-001"
    
    print("\n" + "="*65)
    print(f"🚀 [KISSANVIKAS] STARTING AUTONOMOUS DRONE SURVEY: {mission_id}")
    print("="*65 + "\n")

    client = BackendDataClient(enable_http=True)
    camera = FrameCaptureManager()
    streamer = LiveCameraStreamer(port=8080)
    streamer.start()

    # ----------------------------------------------------
    # HARDCODED 3D FLIGHT PATH
    # ----------------------------------------------------
    waypoints = [
        # Takeoff
        {"stage": "takeoff", "x": -33.5, "y": 0.0, "z": 4.5, "yaw": 0.0, "name": "Takeoff to 4.5m"},

        # Stage 1: Perimeter Scan (4 Corners of 60m x 30m Polyhouse)
        {"stage": "perimeter_scan", "x": -33.5, "y": -18.5, "z": 4.5, "yaw": -90.0, "name": "South-West Corner"},
        {"stage": "perimeter_scan", "x": 0.0,   "y": -18.5, "z": 4.5, "yaw": 0.0,   "name": "South Wall Midpoint"},
        {"stage": "perimeter_scan", "x": 33.5,  "y": -18.5, "z": 4.5, "yaw": 0.0,   "name": "South-East Corner"},
        {"stage": "perimeter_scan", "x": 33.5,  "y": 18.5,  "z": 4.5, "yaw": 90.0,  "name": "North-East Corner"},
        {"stage": "perimeter_scan", "x": 0.0,   "y": 18.5,  "z": 4.5, "yaw": 180.0, "name": "North Wall Midpoint"},
        {"stage": "perimeter_scan", "x": -33.5, "y": 18.5,  "z": 4.5, "yaw": 180.0, "name": "North-West Corner"},
        {"stage": "perimeter_scan", "x": -33.5, "y": 0.0,   "z": 4.5, "yaw": -90.0, "name": "Return to Entrance"},

        # Stage 2: Interior Crop Rows (Serpentine Scan)
        {"stage": "interior_scan", "x": -25.0, "y": 0.0,   "z": 3.2, "yaw": 0.0,   "name": "Enter Main Walkway"},
        
        # Zone A: Tomato Beds (North-West)
        {"stage": "interior_scan", "x": -22.0, "y": 7.5,   "z": 3.2, "yaw": 0.0,   "name": "Zone A: Tomato Bed 1-6 [West]"},
        {"stage": "interior_scan", "x": -5.0,  "y": 7.5,   "z": 3.2, "yaw": 0.0,   "name": "Zone A: Tomato Bed 7-12 [East]"},
        
        # Zone B: Capsicum Beds (North-East)
        {"stage": "interior_scan", "x": 5.0,   "y": 7.5,   "z": 3.2, "yaw": 0.0,   "name": "Zone B: Capsicum Bed 1-6 [West]"},
        {"stage": "interior_scan", "x": 22.0,  "y": 7.5,   "z": 3.2, "yaw": 0.0,   "name": "Zone B: Capsicum Bed 7-12 [East]"},
        
        # Cross Aisle to South Section
        {"stage": "interior_scan", "x": 0.0,   "y": 0.0,   "z": 3.2, "yaw": -90.0, "name": "Cross Walkway Transition"},

        # Zone D: Eggplant Beds (South-East)
        {"stage": "interior_scan", "x": 22.0,  "y": -7.5,  "z": 3.2, "yaw": 180.0, "name": "Zone D: Eggplant Bed 1-6 [East]"},
        {"stage": "interior_scan", "x": 5.0,   "y": -7.5,  "z": 3.2, "yaw": 180.0, "name": "Zone D: Eggplant Bed 7-12 [West]"},

        # Zone C: Cucumber Beds (South-West)
        {"stage": "interior_scan", "x": -5.0,  "y": -7.5,  "z": 3.2, "yaw": 180.0, "name": "Zone C: Cucumber Bed 1-6 [East]"},
        {"stage": "interior_scan", "x": -22.0, "y": -7.5,  "z": 3.2, "yaw": 180.0, "name": "Zone C: Cucumber Bed 7-12 [West]"},

        # Exit & Landing
        {"stage": "interior_scan", "x": -28.0, "y": 0.0,   "z": 3.2, "yaw": 180.0, "name": "Exit Through Doorway"},
        {"stage": "landing",       "x": -33.5, "y": 0.0,   "z": 0.1, "yaw": 0.0,   "name": "Touchdown on Helipad"}
    ]

    client.send_takeoff(mission_id, drone_id)
    cur_x, cur_y, cur_z = -33.5, 0.0, 0.1
    seq = 1
    battery = 99.8
    total_dist = 0.0

    current_stage = ""

    for wp in waypoints:
        stage = wp["stage"]
        tx, ty, tz, tyaw = wp["x"], wp["y"], wp["z"], wp["yaw"]
        
        if stage != current_stage:
            current_stage = stage
            print(f"\n--- 📍 STAGE: {stage.upper()} ---")
            if stage == "perimeter_scan":
                client.send_perimeter_scan_started(mission_id, drone_id)
            elif stage == "interior_scan":
                client.send_interior_scan_started(mission_id, drone_id)

        print(f"🚁 Flying to: {wp['name']} -> ({tx:.1f}m, {ty:.1f}m, {tz:.1f}m)")

        # Interpolate 10 smooth visual steps
        steps = 10
        for i in range(1, steps + 1):
            frac = i / float(steps)
            step_x = cur_x + (tx - cur_x) * frac
            step_y = cur_y + (ty - cur_y) * frac
            step_z = cur_z + (tz - cur_z) * frac
            
            d = math.sqrt((step_x - cur_x)**2 + (step_y - cur_y)**2 + (step_z - cur_z)**2)
            total_dist += d
            battery = max(10.0, battery - 0.05)

            # 1. Update Gazebo 3D model
            move_gazebo(step_x, step_y, step_z, tyaw)

            # 2. Update Live Web FPV Stream
            crop_zone = determine_crop_zone(step_x, step_y)
            streamer.render_and_publish_frame(
                mission_id=mission_id,
                stage=stage,
                x_m=step_x,
                y_m=step_y,
                z_m=step_z,
                heading_deg=tyaw,
                speed_mps=2.0,
                battery_percent=battery,
                crop_zone=crop_zone
            )

            # 3. Stream telemetry
            streamer.update_telemetry(
                altitude_m=step_z,
                speed_mps=2.0,
                heading_deg=tyaw,
                battery_percent=battery,
                stage=stage,
                frames_captured=seq - 1,
                position={"x_m": round(step_x, 2), "y_m": round(step_y, 2), "z_m": round(step_z, 2)}
            )
            client.send_telemetry(
                mission_id=mission_id,
                drone_id=drone_id,
                x_m=step_x,
                y_m=step_y,
                z_m=step_z,
                speed_mps=2.0,
                heading_deg=tyaw,
                stage=stage,
                battery_percent=battery
            )
            time.sleep(0.08 / speed_mult)

        cur_x, cur_y, cur_z = tx, ty, tz

        # Capture Survey Frame at each waypoint
        if stage in ["perimeter_scan", "interior_scan"]:
            frame_id = f"F-{seq:06d}"
            img_url, w, h = camera.capture_frame(
                mission_id=mission_id,
                frame_id=frame_id,
                stage=stage,
                x_m=cur_x,
                y_m=cur_y,
                z_m=cur_z,
                heading_deg=tyaw,
                crop_zone_hint=crop_zone
            )
            client.send_frame(
                mission_id=mission_id,
                drone_id=drone_id,
                frame_id=frame_id,
                sequence_number=seq,
                stage=stage,
                image_url=img_url,
                width=w,
                height=h,
                x_m=cur_x,
                y_m=cur_y,
                z_m=cur_z,
                yaw_deg=tyaw
            )
            print(f"  📸 [FRAME {seq}] Captured at ({cur_x:.1f}m, {cur_y:.1f}m, {cur_z:.1f}m)")
            seq += 1

    # Landing & Disarm
    client.send_landing(mission_id, drone_id)
    move_gazebo(-33.5, 0.0, 0.1, 0.0)
    client.send_landed(mission_id, drone_id)

    total_frames = seq - 1
    client.send_completed(mission_id, drone_id, total_frames, total_dist, 60)
    streamer.stop()

    # ----------------------------------------------------
    # GENERATE & EXPORT DIGITAL TWIN JSON
    # ----------------------------------------------------
    testing_dir = os.path.join(repo_root, "testing")
    os.makedirs(testing_dir, exist_ok=True)
    
    template_path = os.path.join(repo_root, "digital_twin_complete.json")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            twin_data = json.load(f)
    else:
        twin_data = {
            "polyhouse_id": "POLYHOUSE-01",
            "name": "KissanVikas Smart Polyhouse",
            "dimensions": {"length_m": 60.0, "width_m": 30.0, "height_m": 6.5},
            "status": "active"
        }

    twin_data["mission_id"] = mission_id
    twin_data["drone_id"] = drone_id
    twin_data["last_survey_at"] = datetime.now(timezone.utc).isoformat()
    twin_data["survey_metrics"] = {
        "status": "completed",
        "total_frames_captured": total_frames,
        "flight_distance_m": round(total_dist, 2),
        "coverage_percent": 100.0,
        "remaining_battery_percent": round(battery, 1)
    }

    out_file = os.path.join(testing_dir, f"digital_twin_mission_{mission_id}.json")
    latest_file = os.path.join(testing_dir, "digital_twin_latest.json")
    root_latest = os.path.join(repo_root, "digital_twin_latest.json")

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(twin_data, f, indent=2)
    with open(latest_file, "w", encoding="utf-8") as f:
        json.dump(twin_data, f, indent=2)
    with open(root_latest, "w", encoding="utf-8") as f:
        json.dump(twin_data, f, indent=2)

    print("\n" + "="*65)
    print("🎉 [SUCCESS] SURVEY COMPLETED & DIGITAL TWIN SAVED!")
    print(f"Total Frames Captured: {total_frames}")
    print(f"Total Flight Distance: {total_dist:.1f} meters")
    print(f"📄 Output Saved to:")
    print(f"   ↳ {latest_file}")
    print(f"   ↳ {root_latest}")
    print("="*65 + "\n")


if __name__ == "__main__":
    speed = float(sys.argv[1]) if len(sys.argv) > 1 else 2.0
    run_direct_survey(speed_mult=speed)
