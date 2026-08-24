from app.reconstruction.coordinates.coordinate_mapper import CoordinateMapper


def main():
    mapper = CoordinateMapper(
        image_width=1920,
        image_height=1080,
        polyhouse_width_m=12.0,
        polyhouse_length_m=8.0,
    )

    x_m, y_m = mapper.pixel_to_world(
        pixel_x=960,
        pixel_y=540,
    )

    print(f"Polyhouse X: {x_m:.2f} m")
    print(f"Polyhouse Y: {y_m:.2f} m")


if __name__ == "__main__":
    main()