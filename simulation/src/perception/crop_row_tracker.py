"""
Vision-Guided Crop Row Tracker Node (Perception Phase 1).
Processes live camera frames from the downward/angled survey camera,
detects the crop canopy centerline, and calculates real-time lateral error (e_y)
and heading error (e_theta) for closed-loop visual servoing.
"""
import math
from dataclasses import dataclass
from typing import Optional, Tuple, Dict, Any
import numpy as np

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False


@dataclass
class VisualTrackingMetrics:
    lateral_error: float = 0.0          # Normalized lateral error e_y in [-1.0, +1.0] (0 = centered)
    heading_error_deg: float = 0.0      # Heading angle error relative to crop row (-45 to +45 deg)
    canopy_coverage_pct: float = 0.0    # Percentage of frame covered by green crop foliage (0 - 100%)
    is_row_detected: bool = False       # True if a coherent crop row is in view
    is_end_of_row: bool = False         # True when crop canopy terminates (headland reached)
    centroid_x: float = 0.5             # Normalized X coordinate of the lower row centroid
    centroid_y: float = 0.8             # Normalized Y coordinate of the lower row centroid
    target_heading_deg: float = 0.0     # Suggested yaw correction


class CropRowTracker:
    """
    Visual Perception Tracker for Agricultural Drones.
    Extracts geometric centerline of raised crop beds and calculates visual servoing error terms.
    """

    def __init__(
        self,
        green_hsv_lower: Tuple[int, int, int] = (25, 40, 40),
        green_hsv_upper: Tuple[int, int, int] = (85, 255, 255),
        end_of_row_coverage_threshold: float = 3.5,
        min_contour_area: float = 800.0,
    ):
        self.green_lower = np.array(green_hsv_lower, dtype=np.uint8)
        self.green_upper = np.array(green_hsv_upper, dtype=np.uint8)
        self.end_of_row_threshold = end_of_row_coverage_threshold
        self.min_contour_area = min_contour_area

        # Smoothing filter history
        self._prev_lateral_error = 0.0
        self._prev_heading_error = 0.0

    def process_frame(self, image_bgr: np.ndarray) -> Tuple[VisualTrackingMetrics, Optional[np.ndarray]]:
        """
        Analyzes a single camera frame and computes visual servoing metrics.
        Returns (metrics, annotated_debug_image).
        """
        if image_bgr is None or not HAS_CV2:
            return VisualTrackingMetrics(), None

        h, w = image_bgr.shape[:2]
        center_x = w / 2.0

        # 1. Convert to HSV color space & filter green crop canopy
        hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(hsv, self.green_lower, self.green_upper)

        # Morphological opening/closing to eliminate speckle noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask_clean = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask_clean = cv2.morphologyEx(mask_clean, cv2.MORPH_CLOSE, kernel)

        # 2. Compute total canopy coverage percentage
        total_pixels = h * w
        green_pixels = cv2.countNonZero(mask_clean)
        coverage_pct = (green_pixels / float(total_pixels)) * 100.0

        # Check for Headland / End of Crop Bed
        is_end_of_row = coverage_pct < self.end_of_row_threshold

        # 3. Band Analysis: Lower ROI (near drone) and Upper ROI (lookahead)
        lower_band = mask_clean[int(h * 0.55):int(h * 0.95), :]
        upper_band = mask_clean[int(h * 0.15):int(h * 0.55), :]

        m_lower = cv2.moments(lower_band)
        m_upper = cv2.moments(upper_band)

        has_lower = m_lower["m00"] > self.min_contour_area
        has_upper = m_upper["m00"] > self.min_contour_area

        debug_img = image_bgr.copy()

        if has_lower:
            cx_lower = m_lower["m10"] / m_lower["m00"]
            cy_lower = (m_lower["m01"] / m_lower["m00"]) + (h * 0.55)

            # Lateral error in normalized range [-1.0, 1.0] (negative = left, positive = right)
            raw_lateral_error = (cx_lower - center_x) / (w / 2.0)

            # Heading error from lower to upper centroid if lookahead is visible
            if has_upper:
                cx_upper = m_upper["m10"] / m_upper["m00"]
                cy_upper = (m_upper["m01"] / m_upper["m00"]) + (h * 0.15)

                dx = cx_upper - cx_lower
                dy = cy_lower - cy_upper # Inverted image Y
                raw_heading_error = math.degrees(math.atan2(dx, max(dy, 1.0)))
            else:
                raw_heading_error = raw_lateral_error * 25.0
                cx_upper, cy_upper = cx_lower, h * 0.25

            # Exponential Moving Average Smoothing
            lateral_error = 0.7 * raw_lateral_error + 0.3 * self._prev_lateral_error
            heading_error = 0.7 * raw_heading_error + 0.3 * self._prev_heading_error

            self._prev_lateral_error = lateral_error
            self._prev_heading_error = heading_error

            metrics = VisualTrackingMetrics(
                lateral_error=round(float(lateral_error), 3),
                heading_error_deg=round(float(heading_error), 2),
                canopy_coverage_pct=round(float(coverage_pct), 1),
                is_row_detected=True,
                is_end_of_row=is_end_of_row,
                centroid_x=round(float(cx_lower / w), 3),
                centroid_y=round(float(cy_lower / h), 3),
                target_heading_deg=round(float(-heading_error), 2)
            )

            # Draw visual guidance overlay on debug image
            cv2.circle(debug_img, (int(cx_lower), int(cy_lower)), 8, (0, 0, 255), -1)
            cv2.circle(debug_img, (int(cx_upper), int(cy_upper)), 8, (255, 0, 0), -1)
            cv2.line(debug_img, (int(cx_lower), int(cy_lower)), (int(cx_upper), int(cy_upper)), (0, 255, 255), 3)
            cv2.line(debug_img, (int(center_x), 0), (int(center_x), h), (255, 255, 255), 1)

            # Telemetry text overlay
            status_text = f"e_y: {metrics.lateral_error:+.2f} | e_theta: {metrics.heading_error_deg:+.1f} deg | Canopy: {coverage_pct:.1f}%"
            cv2.putText(debug_img, status_text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        else:
            metrics = VisualTrackingMetrics(
                lateral_error=0.0,
                heading_error_deg=0.0,
                canopy_coverage_pct=round(float(coverage_pct), 1),
                is_row_detected=False,
                is_end_of_row=True,
                centroid_x=0.5,
                centroid_y=0.8
            )
            cv2.putText(debug_img, "SEEKING CROP ROW...", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)

        return metrics, debug_img
