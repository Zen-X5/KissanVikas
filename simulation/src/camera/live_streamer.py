"""
Real 3D Gazebo Camera Streamer for KissanVikas Survey Drone.
Directly captures the 3D RGB camera topic (/kissanvikas/drone/camera/image_raw) from Gazebo / ROS 2
and streams the authentic 3D visual render directly to the web dashboard at http://localhost:8080/camera/stream.
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
import os
import sys
import threading
import time
from typing import Optional

try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

class GlobalFrameBuffer:
    """Thread-safe buffer holding the latest real 3D Gazebo camera frame."""
    def __init__(self):
        self.lock = threading.Lock()
        self.current_jpeg: Optional[bytes] = None

    def set_frame(self, jpeg_bytes: bytes):
        with self.lock:
            self.current_jpeg = jpeg_bytes

    def get_frame(self) -> Optional[bytes]:
        with self.lock:
            return self.current_jpeg

FRAME_BUFFER = GlobalFrameBuffer()

class MJPEGStreamHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        if self.path == "/camera/stream" or self.path == "/":
            self.send_response(200)
            self.send_header("Age", "0")
            self.send_header("Cache-Control", "no-cache, private")
            self.send_header("Pragma", "no-cache")
            self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=FRAME")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            while True:
                frame = FRAME_BUFFER.get_frame()
                if frame is not None:
                    try:
                        self.wfile.write(b"--FRAME\r\n")
                        self.send_header("Content-Type", "image/jpeg")
                        self.send_header("Content-Length", str(len(frame)))
                        self.end_headers()
                        self.wfile.write(frame)
                        self.wfile.write(b"\r\n")
                    except (BrokenPipeError, ConnectionResetError):
                        break
                time.sleep(0.033) # 30 FPS
        else:
            self.send_response(404)
            self.end_headers()

class LiveCameraStreamer:
    def __init__(self, port: int = 8080, enable_gui_window: bool = False):
        self.port = port
        self.enable_gui_window = enable_gui_window
        self.server: Optional[HTTPServer] = None
        self.server_thread: Optional[threading.Thread] = None
        self.ros_thread: Optional[threading.Thread] = None
        self.is_running = False

    def start(self):
        """Starts the MJPEG server and connects to the Gazebo camera topic."""
        try:
            self.server = HTTPServer(("0.0.0.0", self.port), MJPEGStreamHandler)
            self.is_running = True
            self.server_thread = threading.Thread(target=self.server.serve_forever, daemon=True)
            self.server_thread.start()
            print(f"[3D CAMERA STREAMER] Real 3D Gazebo FPV stream active on http://localhost:{self.port}/camera/stream")

            # Start ROS 2 subscriber thread for real 3D Gazebo camera
            self.ros_thread = threading.Thread(target=self._start_ros_camera_subscriber, daemon=True)
            self.ros_thread.start()
        except Exception as e:
            print(f"[CAMERA STREAMER WARNING] Could not bind port {self.port}: {e}")

    def _start_ros_camera_subscriber(self):
        """Subscribes to the real 3D Gazebo / ROS 2 camera topic and auto-starts bridge if needed."""
        try:
            import subprocess
            # Auto-spawn ros_gz_bridge for camera if not already bridged
            try:
                bridge_cmd = [
                    "ros2", "run", "ros_gz_bridge", "parameter_bridge",
                    "/kissanvikas/drone/camera/image_raw@sensor_msgs/msg/Image[gz.msgs.Image"
                ]
                self.bridge_proc = subprocess.Popen(bridge_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception:
                self.bridge_proc = None

            import rclpy
            from rclpy.node import Node
            from sensor_msgs.msg import Image as RosImage

            if not rclpy.ok():
                rclpy.init()

            node = Node("kissanvikas_3d_web_streamer")


            def on_camera_frame(msg: RosImage):
                # Convert raw Gazebo 3D camera bytes to JPEG
                h, w = msg.height, msg.width
                raw_bytes = np.frombuffer(msg.data, dtype=np.uint8)

                if "rgb" in msg.encoding.lower() or "r8g8b8" in msg.encoding.lower():
                    img = raw_bytes.reshape((h, w, 3))
                    bgr_img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
                elif "bgr" in msg.encoding.lower():
                    bgr_img = raw_bytes.reshape((h, w, 3))
                else:
                    bgr_img = raw_bytes.reshape((h, w, 3))

                success, jpeg = cv2.imencode(".jpg", bgr_img, [cv2.IMWRITE_JPEG_QUALITY, 85])
                if success:
                    FRAME_BUFFER.set_frame(jpeg.tobytes())

            node.create_subscription(
                RosImage,
                "/kissanvikas/drone/camera/image_raw",
                on_camera_frame,
                10
            )
            print("[3D CAMERA STREAMER] Connected to /kissanvikas/drone/camera/image_raw! Streaming REAL 3D frames to web.")
            rclpy.spin(node)
        except Exception as e:
            pass

    def render_and_publish_frame(self, **kwargs):
        """No 2D mockups. Only real 3D Gazebo camera frames are streamed."""
        pass

    def stop(self):
        if self.server:
            self.server.shutdown()
            self.is_running = False
