"""
Backend Communication Client (Bitupan -> Moumita Handshake Protocol).
Implements exact JSON payloads, timestamps, schemas, and REST endpoints for the KissanVikas Data Contract.
Supports seamless auto-discovery between WSL2 and Windows host.
"""
from datetime import datetime, timezone
import json
import logging
import os
import subprocess
from typing import Any, Dict, Optional
import urllib.request
import urllib.error

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("BitupanSimulatorClient")


def get_default_backend_urls() -> list[str]:
    """Resolves potential backend URLs for Windows, WSL2, and Linux."""
    candidates = []
    env_url = os.environ.get("BACKEND_URL")
    if env_url:
        candidates.append(env_url.rstrip("/"))

    # 1. WSL2 default gateway from `ip route`
    try:
        res = subprocess.run(["ip", "route", "show", "default"], capture_output=True, text=True, timeout=1.0)
        if res.returncode == 0 and res.stdout:
            parts = res.stdout.split()
            if "via" in parts:
                gateway_ip = parts[parts.index("via") + 1]
                candidates.append(f"http://{gateway_ip}:3000/api/v1")
    except Exception:
        pass

    # 2. WSL2 /etc/resolv.conf nameserver
    try:
        if os.path.exists("/etc/resolv.conf"):
            with open("/etc/resolv.conf", "r") as f:
                for line in f:
                    if line.startswith("nameserver"):
                        host_ip = line.split()[1].strip()
                        candidates.append(f"http://{host_ip}:3000/api/v1")
    except Exception:
        pass

    # 3. Standard Localhost addresses
    candidates.append("http://127.0.0.1:3000/api/v1")
    candidates.append("http://localhost:3000/api/v1")
    candidates.append("http://172.24.128.1:3000/api/v1")
    candidates.append("http://10.245.144.34:3000/api/v1")

    # Remove duplicates preserving order
    seen = set()
    deduped = []
    for c in candidates:
        if c not in seen:
            seen.add(c)
            deduped.append(c)

    return deduped


class BackendDataClient:
    def __init__(
        self,
        backend_url: Optional[str] = None,
        timeout_sec: float = 5.0,
        enable_http: bool = True,
    ):
        self.candidate_urls = [backend_url.rstrip("/")] if backend_url else get_default_backend_urls()
        self.active_backend_url = self.candidate_urls[0]
        self.timeout_sec = min(1.5, timeout_sec)
        self.enable_http = enable_http
        self.url_resolved = False
        
        # Async background worker for high-frequency telemetry and frames
        import queue
        import threading
        self._async_queue = queue.Queue(maxsize=50)
        
        def _async_dispatcher():
            while True:
                try:
                    endpoint, payload = self._async_queue.get()
                    self._post(endpoint, payload)
                except Exception:
                    pass
        
        threading.Thread(target=_async_dispatcher, daemon=True).start()

    def _get_iso_timestamp(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

    def _post_async(self, endpoint: str, payload: Dict[str, Any]):
        """Dispatches HTTP POST in background non-blocking thread."""
        if not self.enable_http:
            return
        try:
            if self._async_queue.full():
                try:
                    self._async_queue.get_nowait()
                except Exception:
                    pass
            self._async_queue.put_nowait((endpoint, payload))
        except Exception:
            pass

    def _post(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Sends POST request to the NestJS backend and logs response with automatic URL fallback."""
        if not self.enable_http:
            return {"success": True, "mock": True}

        json_data = json.dumps(payload).encode("utf-8")
        urls_to_try = [self.active_backend_url] if self.url_resolved else self.candidate_urls

        last_error = None
        for base_url in urls_to_try:
            url = f"{base_url}/{endpoint.lstrip('/')}"
            try:
                req = urllib.request.Request(
                    url,
                    data=json_data,
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=self.timeout_sec) as resp:
                    result = json.loads(resp.read().decode("utf-8"))
                    if not self.url_resolved:
                        self.active_backend_url = base_url
                        self.url_resolved = True
                    return result
            except Exception as e:
                last_error = e

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
        """Event: Perimeter scan loop completed"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "stage": "perimeter_scan",
            "status": "completed",
            "timestamp": self._get_iso_timestamp(),
            "statistics": {
                "frames_captured": frames_captured,
                "flight_distance_m": round(flight_distance_m, 2),
                "duration_seconds": duration_seconds,
                "coverage_percent": 100.0
            }
        }
        return self._post("/missions/events/stage", payload)

    def send_interior_scan_started(self, mission_id: str, drone_id: str) -> Dict[str, Any]:
        """Event: Interior crop scanning started"""
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
        """Event: Interior scan completed"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "stage": "interior_scan",
            "status": "completed",
            "timestamp": self._get_iso_timestamp(),
            "statistics": {
                "frames_captured": frames_captured,
                "flight_distance_m": round(flight_distance_m, 2),
                "duration_seconds": duration_seconds,
                "coverage_percent": 100.0
            }
        }
        return self._post("/missions/events/stage", payload)

    def send_landing(self, mission_id: str, drone_id: str) -> Dict[str, Any]:
        """Event: Landing initiated back to helipad"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "status": "landing",
            "timestamp": self._get_iso_timestamp()
        }
        return self._post("/missions/events/landing", payload)

    def send_landed(self, mission_id: str, drone_id: str) -> Dict[str, Any]:
        """Event: Touchdown completed on landing pad"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "status": "landed",
            "timestamp": self._get_iso_timestamp()
        }
        return self._post("/missions/events/landed", payload)

    def send_completed(
        self,
        mission_id: str,
        drone_id: str,
        total_frames: int,
        total_distance_m: float,
        total_duration_sec: int
    ) -> Dict[str, Any]:
        """Event: Full Mission Completed"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "status": "completed",
            "timestamp": self._get_iso_timestamp(),
            "statistics": {
                "frames_captured": total_frames,
                "flight_distance_m": round(total_distance_m, 2),
                "duration_seconds": total_duration_sec,
                "coverage_percent": 100.0
            }
        }
        return self._post("/missions/events/complete", payload)

    def send_mission_completed(
        self,
        mission_id: str,
        drone_id: str,
        frames_captured: int = 0,
        flight_distance_m: float = 0.0,
        coverage_percent: float = 100.0
    ) -> Dict[str, Any]:
        """Alias for send_completed"""
        return self.send_completed(
            mission_id=mission_id,
            drone_id=drone_id,
            total_frames=frames_captured,
            total_distance_m=flight_distance_m,
            total_duration_sec=120
        )

    # ========================================================
    # 2. CONTINUOUS TELEMETRY STREAM (250ms interval)
    # ========================================================

    def send_telemetry(
        self,
        mission_id: str,
        drone_id: str,
        x_m: float,
        y_m: float,
        z_m: float,
        speed_mps: float,
        heading_deg: float,
        stage: str,
        battery_percent: float = 98.5
    ):
        """Telemetry Log Packet (Non-blocking async stream)"""
        payload = {
            "mission_id": mission_id,
            "drone_id": drone_id,
            "timestamp": self._get_iso_timestamp(),
            "stage": stage,
            "position": {
                "x_m": round(x_m, 3),
                "y_m": round(y_m, 3),
                "z_m": round(z_m, 3)
            },
            "altitude_m": round(z_m, 3),
            "speed_mps": round(speed_mps, 2),
            "heading_deg": round(heading_deg, 1),
            "battery_percent": round(battery_percent, 1)
        }
        self._post_async("/missions/telemetry", payload)
        return {"success": True, "queued": True}

    # ========================================================
    # 3. HIGH-RES SURVEY FRAMES (1080p + Pose Snapshot)
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
        yaw_deg: float,
        fov_deg: float = 78.0,
        gimbal_pitch_deg: float = -60.0
    ):
        """Survey Frame with Synchronized Camera & Spatial Pose (Non-blocking async)"""
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
                    "x_m": round(x_m, 3),
                    "y_m": round(y_m, 3),
                    "z_m": round(z_m, 3)
                },
                "orientation": {
                    "roll_deg": 0.0,
                    "pitch_deg": -5.0,
                    "yaw_deg": round(yaw_deg, 1)
                }
            },
            "camera": {
                "fov_deg": fov_deg,
                "gimbal_pitch_deg": gimbal_pitch_deg,
                "gimbal_yaw_deg": 0.0
            }
        }
        self._post_async("/missions/frames", payload)
        return {"success": True, "queued": True}
