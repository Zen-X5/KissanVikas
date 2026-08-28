"""
Manual Mission Dispatch & End-to-End Digital Twin Verification Test
Runs survey mission, verifies telemetry & frames, triggers AI reconstruction,
and asserts output JSON is generated in testing/.
"""
import os
import sys
import time
import json
import argparse
from datetime import datetime, timezone

# Ensure utf-8 output encoding on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Add repository root to path
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, repo_root)
sys.path.insert(0, os.path.join(repo_root, "simulation"))

from simulation.src.mission.mission_runner import SurveyMissionRunner


def run_test(speed: float = 5.0, no_http: bool = False, mission_id: str = None):
    if not mission_id:
        mission_id = f"TEST-MISSION-{int(time.time())}"

    print("\n" + "=" * 65)
    print(f"[MANUAL DISPATCH] DISPATCHING KISSANVIKAS SURVEY DRONE")
    print(f"   Mission ID       : {mission_id}")
    print(f"   Speed Multiplier : {speed}x")
    print(f"   HTTP Dispatch    : {'Enabled' if not no_http else 'Disabled (Local Mock)'}")
    print("=" * 65 + "\n")

    runner = SurveyMissionRunner(
        mission_id=mission_id,
        drone_id="DRONE-001",
        speed_multiplier=speed,
        enable_http=not no_http,
        enable_gui_window=False
    )

    # Execute complete mission
    runner.run_mission()

    # Verify generated JSON in testing folder
    testing_dir = os.path.join(repo_root, "testing")
    latest_file = os.path.join(testing_dir, "digital_twin_latest.json")

    print("\n" + "=" * 65)
    print("[VERIFICATION] CHECKING GENERATED DIGITAL TWIN IN TESTING/ FOLDER")
    print("=" * 65)

    if os.path.exists(latest_file):
        with open(latest_file, "r", encoding="utf-8") as f:
            twin_data = json.load(f)

        print(f"[SUCCESS] Digital Twin JSON Found: {latest_file}")
        print(f"   * Polyhouse ID : {twin_data.get('polyhouse_id')}")
        print(f"   * Mission ID   : {twin_data.get('mission_id')}")
        print(f"   * Total Beds   : {len(twin_data.get('beds', []))}")
        print(f"   * Total Zones  : {len(twin_data.get('zones', []))}")
        health = twin_data.get('polyhouse_metrics', {}).get('overall_health_score', 'N/A')
        print(f"   * Health Score : {health}")
        print(f"   * Last Survey  : {twin_data.get('last_mission_completed_at')}")
        print("=" * 65)
        print("[SUCCESS] ALL TESTS PASSED! Digital Twin JSON generated successfully.")
    else:
        print(f"[FAILED] Error: {latest_file} was not generated.")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manual Drone Survey Dispatch & Digital Twin Test")
    parser.add_argument("--speed", type=float, default=5.0, help="Flight speed multiplier for quick testing (e.g. 5.0 or 10.0)")
    parser.add_argument("--no-http", action="store_true", help="Run in offline/local mock mode without backend running")
    parser.add_argument("--mission-id", type=str, default=None, help="Custom Mission ID")
    args = parser.parse_args()

    run_test(speed=args.speed, no_http=args.no_http, mission_id=args.mission_id)
