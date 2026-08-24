from typing import Tuple


class CoordinateMapper:
    """
    Converts 2D image pixel coordinates into
    2D polyhouse-local coordinates.

    This is currently a simple placeholder mapping.

    Later, this class will contain the actual spatial
    transformation based on:
        - drone pose
        - camera parameters
        - gimbal orientation
        - polyhouse geometry
        - perspective/homography
    """

    def __init__(
        self,
        image_width: int,
        image_height: int,
        polyhouse_width_m: float,
        polyhouse_length_m: float,
    ):
        self.image_width = image_width
        self.image_height = image_height

        self.polyhouse_width_m = polyhouse_width_m
        self.polyhouse_length_m = polyhouse_length_m

    def pixel_to_world(
        self,
        pixel_x: float,
        pixel_y: float,
    ) -> Tuple[float, float]:
        """
        Convert an image pixel coordinate into a
        temporary 2D polyhouse-local coordinate.

        Returns:
            (x_m, y_m)
        """

        if self.image_width <= 0:
            raise ValueError("image_width must be greater than 0")

        if self.image_height <= 0:
            raise ValueError("image_height must be greater than 0")

        if self.polyhouse_width_m <= 0:
            raise ValueError("polyhouse_width_m must be greater than 0")

        if self.polyhouse_length_m <= 0:
            raise ValueError("polyhouse_length_m must be greater than 0")

        x_m = (
            pixel_x / self.image_width
        ) * self.polyhouse_width_m

        y_m = (
            pixel_y / self.image_height
        ) * self.polyhouse_length_m

        return x_m, y_m