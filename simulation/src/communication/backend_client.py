"""
Backend Communication Client (Bitupan -> Moumita Handshake Protocol).
Implements exact JSON payloads, timestamps, schemas, and REST endpoints for the KissanVikas Data Contract.
"""
from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, Optional
import urllib.request
import urllib.error

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("BitupanSimulatorClient")

class BackendDataClient:
    def __init__(
        self,
        backend_url: str = "http://localhost:3000/api/v1",
        timeout_sec: float = 5.0,
        enable_http: bool = True,
    ):
        self.backend_url = backend_url.rstrip("/")
        self.timeout_sec = timeout_sec
        self.enable_http = enable_http

    def _get_iso_timestamp(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

    def _post(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Sends POST request to the NestJS backend and logs response."""
        url = f"{self.backend_url}/{endpoint.lstrip('/')}"
        json_data = json.dumps(payload, indent=2)

        if not self.enable_http:
            return {"success": True, "mock": True}

        try:
            req = urllib.request.Request(
                url,
                data=json_data.encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=self.timeout_sec) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                logger.info(f"[IN FROM BACKEND {endpoint}]: {result}")
                return result
        except Exception as e:
            logger.warning(f"⚠️ [BACKEND UNREACHABLE {endpoint}]: {e}")
            return {"success": False, "offline": True}

    # ========================================================
    # 1. LIFECYCLE HANDSHAKE EVENTS
    # ========================================================

    def send_takeoff(self, mission_id: str, drone_id: str) -> Dict[str, Any]:
        """Event: Takeoff started"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "status": "taking_off",
            "timestamp": self._get_iso_timestamp()
        }
        return self._post("/missions/events/takeoff", payload)

    def send_perimeter_scan_started(self, mission_id: str, drone_id: str) -> Dict[str, Any]:
        """Event: Perimeter scan started once airborne at planned altitude"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "stage": "perimeter_scan",
            "status": "started",
            "timestamp": self._get_iso_timestamp()
        }
        return self._post("/missions/events/stage", payload)

    def send_perimeter_scan_completed(
        self,
        mission_id: str,
        drone_id: str,
        frames_captured: int,
        flight_distance_m: float,
        duration_seconds: int
    ) -> Dict[str, Any]:
        """Event: Perimeter scan completed with statistics"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "stage": "perimeter_scan",
            "status": "completed",
            "timestamp": self._get_iso_timestamp(),
            "statistics": {
                "frames_captured": frames_captured,
                "flight_distance_m": round(flight_distance_m, 1),
                "duration_seconds": duration_seconds
            }
        }
        return self._post("/missions/events/stage", payload)

    def send_interior_scan_started(self, mission_id: str, drone_id: str) -> Dict[str, Any]:
        """Event: Interior scan started"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "stage": "interior_scan",
            "status": "started",
            "timestamp": self._get_iso_timestamp()
        }
        return self._post("/missions/events/stage", payload)

    def send_interior_scan_completed(
        self,
        mission_id: str,
        drone_id: str,
        frames_captured: int,
        flight_distance_m: float,
        duration_seconds: int
    ) -> Dict[str, Any]:
        """Event: Interior scan completed with statistics"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "stage": "interior_scan",
            "status": "completed",
            "timestamp": self._get_iso_timestamp(),
            "statistics": {
                "frames_captured": frames_captured,
                "flight_distance_m": round(flight_distance_m, 1),
                "duration_seconds": duration_seconds
            }
        }
        return self._post("/missions/events/stage", payload)

    def send_landing(self, mission_id: str, drone_id: str) -> Dict[str, Any]:
        """Event: Drone initiates landing sequence"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "status": "landing",
            "timestamp": self._get_iso_timestamp()
        }
        return self._post("/missions/events/landing", payload)

    def send_landed(self, mission_id: str, drone_id: str) -> Dict[str, Any]:
        """Event: Drone has successfully landed"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "status": "landed",
            "timestamp": self._get_iso_timestamp()
        }
        return self._post("/missions/events/landed", payload)

    def send_mission_completed(
        self,
        mission_id: str,
        drone_id: str,
        frames_captured: int,
        flight_distance_m: float,
        coverage_percent: float
    ) -> Dict[str, Any]:
        """Event: Final mission summary & completion"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "status": "completed",
            "timestamp": self._get_iso_timestamp(),
            "statistics": {
                "frames_captured": frames_captured,
                "flight_distance_m": round(flight_distance_m, 1),
                "coverage_percent": round(coverage_percent, 1)
            }
        }
        return self._post("/missions/events/complete", payload)

    # ========================================================
    # 2. TELEMETRY LOG STREAMING (Every 200-500 ms)
    # ========================================================

    def send_telemetry(
        self,
        mission_id: str,
        drone_id: str,
        stage: str,
        x_m: float,
        y_m: float,
        z_m: float,
        speed_mps: float,
        heading_deg: float,
        battery_percent: float
    ) -> Dict[str, Any]:
        """Live 200-500ms telemetry packet stream"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "timestamp": self._get_iso_timestamp(),
            "stage": stage,
            "position": {
                "x_m": round(x_m, 2),
                "y_m": round(y_m, 2),
                "z_m": round(z_m, 2)
            },
            "altitude_m": round(z_m, 2),
            "speed_mps": round(speed_mps, 2),
            "heading_deg": round(heading_deg, 1),
            "battery_percent": round(battery_percent, 1)
        }
        # No strict acknowledgement needed per telemetry packet
        return self._post("/missions/telemetry", payload)

    # ========================================================
    # 3. SURVEY FRAME CAPTURE PAYLOAD
    # ========================================================

    def send_frame(
        self,
        mission_id: str,
        drone_id: str,
        frame_id: str,
        sequence_number: int,
        stage: str,
        image_url: str,
        width: int,
        height: int,
        x_m: float,
        y_m: float,
        z_m: float,
        roll_deg: float = 0.0,
        pitch_deg: float = -5.0,
        yaw_deg: float = 90.0,
        fov_deg: float = 78.0,
        gimbal_pitch_deg: float = -60.0,
        gimbal_yaw_deg: float = 0.0
    ) -> Dict[str, Any]:
        """High-resolution survey frame capture packet"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "frame_id": frame_id,
            "sequence_number": sequence_number,
            "stage": stage,
            "timestamp": self._get_iso_timestamp(),
            "image": {
                "url": image_url,
                "width": width,
                "height": height
            },
            "drone_pose": {
                "position": {
                    "x_m": round(x_m, 2),
                    "y_m": round(y_m, 2),
                    "z_m": round(z_m, 2)
                },
                "orientation": {
                    "roll_deg": round(roll_deg, 1),
                    "pitch_deg": round(pitch_deg, 1),
                    "yaw_deg": round(yaw_deg, 1)
                }
            },
            "camera": {
                "fov_deg": fov_deg,
                "gimbal_pitch_deg": gimbal_pitch_deg,
                "gimbal_yaw_deg": gimbal_yaw_deg
            }
        }
        return self._post("/missions/frames", payload)
