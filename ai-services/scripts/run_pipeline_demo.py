"""
End-to-End Test and Demonstration of Sahid's AI & Spatial Twin Pipeline.
Simulates processing an interior survey frame and prints the generated Digital Twin JSON.
"""
import asyncio
import json
import os
import sys

# Ensure ai-services root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.schemas.requests import AnalyzeFrameRequest, CameraParameters, DronePose, ImageInfo, Orientation, Position
from app.vision.inference import VisionInference


async def main():
    print("=" * 65)
    print("[TEST] KISSANVIKAS AI PIPELINE - END-TO-END DEMO TEST")
    print("=" * 65)

    inference_engine = VisionInference(
        polyhouse_length_m=60.0,
        polyhouse_width_m=30.0,
        model_path="yolo26n.pt"
    )

    # 1. Create a mock survey frame request at Tomato Bed 1 (Zone A)
    req = AnalyzeFrameRequest(
        mission_id="MISSION-SURVEY-001",
        drone_id="DRONE-001",
        frame_id="F-000012",
        sequence_number=12,
        stage="interior_scan",
        timestamp="2026-08-27T11:30:00Z",
        image=ImageInfo(
            url="http://localhost:8080/media/surveys/MISSION-SURVEY-001/F-000012.jpg",
            width=1920,
            height=1080
        ),
        drone_pose=DronePose(
            position=Position(x_m=-20.5, y_m=3.5, z_m=4.5),
            orientation=Orientation(roll_deg=0.0, pitch_deg=-5.0, yaw_deg=90.0)
        ),
        camera=CameraParameters(
            fov_deg=78.0,
            gimbal_pitch_deg=-60.0,
            gimbal_yaw_deg=0.0
        )
    )

    print(f"\n[1] Ingesting Drone Frame: {req.frame_id} at Pose (X={req.drone_pose.position.x_m}m, Y={req.drone_pose.position.y_m}m, Z={req.drone_pose.position.z_m}m)...")
    print("[2] Running YOLO Detection + VARI Chlorophyll Index + 3D Ray-Plane Georeferencer...")

    # 2. Run Pipeline
    result = await inference_engine.analyze_single_frame(req, polyhouse_id="PH-DEMO-001")

    # 3. Print Output
    print("\n[3] Reconstructed Polyhouse Spatial Digital Twin Output:")
    print("=" * 65)
    formatted_json = json.dumps(result.model_dump(), indent=2)
    print(formatted_json)
    print("=" * 65)
    print(f"\n[SUCCESS] Pipeline successfully detected and mapped:")
    print(f" - Total Objects: {len(result.objects)}")
    print(f" - Total Relationships: {len(result.relationships)}")
    print(f" - Overall Health Score: {result.summary.overall_health_score}")
    print(f" - Total Zones: {result.summary.total_zones}")
    print("=" * 65)


if __name__ == "__main__":
    asyncio.run(main())
