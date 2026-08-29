#!/usr/bin/env bash
# ==============================================================================
# KissanVikas ArduPilot SITL & Gazebo Harmonic Simulation Launcher
# ==============================================================================
# This script sets up the environment and launches ArduCopter SITL alongside
# the KissanVikas Smart Polyhouse world in Gazebo Harmonic.
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SIM_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$SIM_DIR")"

echo "=============================================================================="
echo "🌿 KISSANVIKAS — ARDUPILOT SITL & GAZEBO HARMONIC LAUNCHER"
echo "=============================================================================="

# 1. Source ROS 2 Jazzy if installed
if [ -f "/opt/ros/jazzy/setup.bash" ]; then
    echo "📦 Sourcing ROS 2 Jazzy..."
    source /opt/ros/jazzy/setup.bash
fi

# 2. Export Gazebo Model & Plugin paths
export GZ_SIM_RESOURCE_PATH="$SIM_DIR/models:$SIM_DIR/models/crop_beds:$SIM_DIR/models/crops:$SIM_DIR/models/survey_drone:$GZ_SIM_RESOURCE_PATH"
export GZ_SIM_SYSTEM_PLUGIN_PATH="/usr/lib/x86_64-linux-gnu/gz-sim-8/plugins:$GZ_SIM_SYSTEM_PLUGIN_PATH"

WORLD_FILE="$SIM_DIR/worlds/polyhouse/polyhouse.sdf"

echo "📍 Polyhouse World: $WORLD_FILE"
echo "📡 MAVLink GCS Port: UDP 14550"
echo "🎮 MAVSDK/PyMAVLink Port: UDP 14540"
echo ""

# 3. Check for ArduPilot SITL toolchain
if command -v sim_vehicle.py &> /dev/null; then
    echo "🛸 Launching ArduCopter SITL with Gazebo Harmonic plugin..."
    sim_vehicle.py -v ArduCopter -f gazebo-iris --model JSON --out=udp:127.0.0.1:14550 --out=udp:127.0.0.1:14540 &
    SITL_PID=$!
    echo "✅ SITL PID: $SITL_PID"
else
    echo "ℹ️  ArduPilot `sim_vehicle.py` not detected in global PATH."
    echo "   Using KissanVikas Integrated SITL MAVLink Engine."
fi

# 4. Launch Gazebo Harmonic (unpaused)
echo "🚀 Starting Gazebo Harmonic (Polyhouse World)..."
gz sim -r -v 3 "$WORLD_FILE"
