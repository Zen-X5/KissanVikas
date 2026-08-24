import asyncio

from app.vision.inference import VisionInference


IMAGE_URL = "https://www.ultralytics.com/images/bus.jpg"


async def main():

    print("Starting complete Sahid pipeline...\n")

    vision = VisionInference(
        polyhouse_width_m=12.0,
        polyhouse_length_m=8.0,
    )

    result = await vision.analyze_image(
        image_url=IMAGE_URL,
        image_width=810,
        image_height=1080,
        mission_id="MISSION-TEST-001",
        polyhouse_id="PH-TEST-001",
        frame_id="F-000001",
    )

    print("\n===== SPATIAL TWIN OUTPUT =====\n")

    print(result.model_dump_json(indent=2))


if __name__ == "__main__":
    asyncio.run(main())