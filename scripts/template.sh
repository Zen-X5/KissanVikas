#!/bin/bash

set -e

echo "🚀 Creating project structure..."

# ============================================================
# WEB APP - Next.js
# ============================================================

mkdir -p web-app/app/dashboard
mkdir -p web-app/app/polyhouses
mkdir -p web-app/app/missions
mkdir -p web-app/app/surveys
mkdir -p web-app/app/digital-twin
mkdir -p web-app/app/sensors

mkdir -p web-app/components/ui
mkdir -p web-app/components/dashboard
mkdir -p web-app/components/polyhouse
mkdir -p web-app/components/mission
mkdir -p web-app/components/survey
mkdir -p web-app/components/digital-twin
mkdir -p web-app/components/sensors

mkdir -p web-app/hooks
mkdir -p web-app/lib

mkdir -p web-app/services/api
mkdir -p web-app/services/missions
mkdir -p web-app/services/polyhouses
mkdir -p web-app/services/surveys
mkdir -p web-app/services/digital-twin

mkdir -p web-app/types
mkdir -p web-app/public
mkdir -p web-app/tests

touch web-app/.env.example


# ============================================================
# BACKEND - NestJS
# ============================================================

mkdir -p backend/src/auth/guards
mkdir -p backend/src/auth/strategies
mkdir -p backend/src/auth/dto

mkdir -p backend/src/users/schemas
mkdir -p backend/src/users/dto

mkdir -p backend/src/polyhouses/schemas
mkdir -p backend/src/polyhouses/dto

mkdir -p backend/src/missions/schemas
mkdir -p backend/src/missions/dto

mkdir -p backend/src/surveys/schemas
mkdir -p backend/src/surveys/dto

mkdir -p backend/src/telemetry/schemas
mkdir -p backend/src/telemetry/dto

mkdir -p backend/src/digital-twin/schemas
mkdir -p backend/src/digital-twin/dto

mkdir -p backend/src/sensors/schemas
mkdir -p backend/src/sensors/dto

mkdir -p backend/src/ai
mkdir -p backend/src/media

mkdir -p backend/src/common/decorators
mkdir -p backend/src/common/filters
mkdir -p backend/src/common/guards
mkdir -p backend/src/common/interceptors
mkdir -p backend/src/common/pipes
mkdir -p backend/src/common/utils

mkdir -p backend/src/config
mkdir -p backend/test

touch backend/.env.example


# ============================================================
# MOBILE APP - React Native
# ============================================================

mkdir -p mobile-app/src/screens/auth
mkdir -p mobile-app/src/screens/dashboard
mkdir -p mobile-app/src/screens/polyhouses
mkdir -p mobile-app/src/screens/missions
mkdir -p mobile-app/src/screens/surveys
mkdir -p mobile-app/src/screens/digital-twin

mkdir -p mobile-app/src/components
mkdir -p mobile-app/src/navigation
mkdir -p mobile-app/src/services
mkdir -p mobile-app/src/hooks
mkdir -p mobile-app/src/store
mkdir -p mobile-app/src/utils
mkdir -p mobile-app/src/types

mkdir -p mobile-app/assets
mkdir -p mobile-app/tests


# ============================================================
# AI SERVICES - FastAPI
# ============================================================

mkdir -p ai-services/app/api/routes

# Vision
mkdir -p ai-services/app/vision/detection/models
mkdir -p ai-services/app/vision/segmentation
mkdir -p ai-services/app/vision/crop-analysis
mkdir -p ai-services/app/vision/preprocessing

# Reconstruction
mkdir -p ai-services/app/reconstruction/mapping
mkdir -p ai-services/app/reconstruction/localization
mkdir -p ai-services/app/reconstruction/coordinates
mkdir -p ai-services/app/reconstruction/geometry
mkdir -p ai-services/app/reconstruction/spatial

# Intelligence
mkdir -p ai-services/app/intelligence/prediction
mkdir -p ai-services/app/intelligence/recommendations
mkdir -p ai-services/app/intelligence/optimization
mkdir -p ai-services/app/intelligence/rules

# Other
mkdir -p ai-services/app/models
mkdir -p ai-services/app/schemas
mkdir -p ai-services/app/services
mkdir -p ai-services/app/core

mkdir -p ai-services/models
mkdir -p ai-services/tests/vision
mkdir -p ai-services/tests/reconstruction
mkdir -p ai-services/tests/intelligence
mkdir -p ai-services/scripts

touch ai-services/app/main.py
touch ai-services/app/api/dependencies.py

touch ai-services/app/api/routes/vision.py
touch ai-services/app/api/routes/reconstruction.py
touch ai-services/app/api/routes/intelligence.py
touch ai-services/app/api/routes/health.py

touch ai-services/app/vision/detection/detector.py
touch ai-services/app/vision/detection/postprocess.py
touch ai-services/app/vision/inference.py

touch ai-services/app/reconstruction/spatial/objects.py
touch ai-services/app/reconstruction/spatial/relationships.py
touch ai-services/app/reconstruction/spatial/builder.py

touch ai-services/app/schemas/requests.py
touch ai-services/app/schemas/responses.py
touch ai-services/app/schemas/telemetry.py
touch ai-services/app/schemas/survey.py
touch ai-services/app/schemas/spatial_twin.py

touch ai-services/app/core/config.py
touch ai-services/app/core/logging.py
touch ai-services/app/core/security.py

touch ai-services/requirements.txt
touch ai-services/.env.example
touch ai-services/README.md


# ============================================================
# DRONE SIMULATOR - ROS 2 + GAZEBO
# ============================================================

mkdir -p drone-simulator/src/drone_controller
mkdir -p drone-simulator/src/mission
mkdir -p drone-simulator/src/flight
mkdir -p drone-simulator/src/camera
mkdir -p drone-simulator/src/sensors
mkdir -p drone-simulator/src/communication
mkdir -p drone-simulator/src/utils

# Gazebo Worlds
mkdir -p drone-simulator/worlds/polyhouse/structure
mkdir -p drone-simulator/worlds/polyhouse/crops
mkdir -p drone-simulator/worlds/polyhouse/irrigation
mkdir -p drone-simulator/worlds/test_world

# Gazebo Models
mkdir -p drone-simulator/models/drone/meshes
mkdir -p drone-simulator/models/drone/config
mkdir -p drone-simulator/models/polyhouse
mkdir -p drone-simulator/models/crops
mkdir -p drone-simulator/models/sensors

# Launch / Config
mkdir -p drone-simulator/launch
mkdir -p drone-simulator/config
mkdir -p drone-simulator/scripts
mkdir -p drone-simulator/tests

# Drone Controller
touch drone-simulator/src/drone_controller/flight_controller.py
touch drone-simulator/src/drone_controller/navigation.py
touch drone-simulator/src/drone_controller/state.py

# Mission
touch drone-simulator/src/mission/mission_manager.py
touch drone-simulator/src/mission/mission_state.py
touch drone-simulator/src/mission/mission_events.py

# Flight
touch drone-simulator/src/flight/takeoff.py
touch drone-simulator/src/flight/landing.py
touch drone-simulator/src/flight/perimeter_scan.py
touch drone-simulator/src/flight/interior_scan.py

# Camera
touch drone-simulator/src/camera/camera_node.py
touch drone-simulator/src/camera/frame_capture.py
touch drone-simulator/src/camera/camera_config.py

# Sensors
touch drone-simulator/src/sensors/imu.py
touch drone-simulator/src/sensors/gps.py
touch drone-simulator/src/sensors/battery.py
touch drone-simulator/src/sensors/telemetry.py

# Communication
touch drone-simulator/src/communication/backend_client.py
touch drone-simulator/src/communication/telemetry_sender.py
touch drone-simulator/src/communication/event_sender.py

# Configuration
touch drone-simulator/config/drone.yaml
touch drone-simulator/config/mission.yaml
touch drone-simulator/config/camera.yaml
touch drone-simulator/config/sensors.yaml

touch drone-simulator/README.md


# ============================================================
# DOCUMENTATION
# ============================================================

mkdir -p docs/architecture
mkdir -p docs/api
mkdir -p docs/data-contracts
mkdir -p docs/ai
mkdir -p docs/drone
mkdir -p docs/digital-twin

touch docs/data-contracts/mission.md
touch docs/data-contracts/telemetry.md
touch docs/data-contracts/survey-frame.md
touch docs/data-contracts/spatial-twin.md


# ============================================================
# DOCKER
# ============================================================

mkdir -p docker/backend
mkdir -p docker/ai-services
mkdir -p docker/web-app


# ============================================================
# ROOT FILES
# ============================================================

touch README.md
touch .gitignore
touch .env.example
touch docker-compose.yml


# ============================================================
# README
# ============================================================

cat > README.md <<'EOF'
# KissanVikas

Smart Polyhouse Digital Twin & Intelligent Management System.

## Applications

- web-app → Next.js
- backend → NestJS
- mobile-app → React Native
- ai-services → FastAPI
- drone-simulator → ROS 2 + Gazebo

## System Flow

Drone Simulator
        ↓
Backend
        ↓
AI / Vision / Intelligence
        ↓
Spatial Information
        ↓
Digital Twin
        ↓
Web / Mobile Applications
EOF


# ============================================================
# COMPLETE
# ============================================================

echo ""
echo "=============================================="
echo "✅ Project structure created successfully!"
echo "=============================================="
echo ""

echo "📁 Main folders:"
echo ""
echo "   ├── web-app/"
echo "   ├── backend/"
echo "   ├── mobile-app/"
echo "   ├── ai-services/"
echo "   ├── drone-simulator/"
echo "   ├── docs/"
echo "   └── docker/"
echo ""

echo "🔥 Ready to build!"