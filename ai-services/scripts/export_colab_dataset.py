"""
Google Colab Training Preparation Script for KissanVikas YOLO Crop & Bed Detector.
Generates data.yaml and Colab training instructions with data augmentations.
"""
import os
import yaml


def generate_colab_training_files():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(base_dir, "dataset")
    os.makedirs(output_dir, exist_ok=True)

    # 1. Generate data.yaml
    data_yaml = {
        "path": "/content/dataset",
        "train": "images/train",
        "val": "images/val",
        "names": {
            0: "tomato_plant",
            1: "capsicum_plant",
            2: "cucumber_plant",
            3: "eggplant_plant",
            4: "growing_bed"
        }
    }

    yaml_path = os.path.join(output_dir, "data.yaml")
    with open(yaml_path, "w", encoding="utf-8") as f:
        yaml.dump(data_yaml, f, default_flow_style=False)

    print(f"[SUCCESS] Created YOLO data configuration: {yaml_path}")

    # 2. Generate Google Colab Python Runner Script
    colab_script = """# =======================================================
# KISSANVIKAS YOLO MULTI-CROP & BED DETECTOR TRAINING
# Run this on Google Colab (with free T4 GPU)
# =======================================================

!pip install ultralytics roboflow opencv-python-headless

from ultralytics import YOLO

# 1. Load Pretrained Lightweight Backbone (YOLO11n / YOLO8n)
model = YOLO('yolo11n.pt')

# 2. Train on Hybrid Agricultural Dataset with Heavy Augmentation
results = model.train(
    data='data.yaml',
    epochs=50,
    imgsz=640,
    batch=16,
    device=0,
    # Domain Randomization Augmentations
    mosaic=1.0,
    mixup=0.15,
    hsv_h=0.015,
    hsv_s=0.7,
    hsv_v=0.4,
    degrees=15.0,
    translate=0.1,
    scale=0.5,
    flipud=0.5,
    fliplr=0.5,
    save=True,
    project='kissanvikas_ai',
    name='crop_bed_detector'
)

# 3. Export Best Weights
print("[COMPLETE] Best model saved at: runs/detect/kissanvikas_ai/crop_bed_detector/weights/best.pt")
"""
    colab_script_path = os.path.join(output_dir, "colab_train.py")
    with open(colab_script_path, "w", encoding="utf-8") as f:
        f.write(colab_script)

    print(f"[SUCCESS] Created Google Colab training runner: {colab_script_path}")


if __name__ == "__main__":
    generate_colab_training_files()
