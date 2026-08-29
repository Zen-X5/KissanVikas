#!/usr/bin/env bash
# ==============================================================================
# KissanVikas Gazebo Simulation Launcher
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Source ROS 2 if available
if [ -f "/opt/ros/jazzy/setup.bash" ]; then
    source /opt/ros/jazzy/setup.bash
fi

# 2. Export Gazebo model paths so all crops & polyhouse structures load
export GZ_SIM_RESOURCE_PATH="$SCRIPT_DIR/models:$SCRIPT_DIR/models/crops:$SCRIPT_DIR/models/crop_beds:$SCRIPT_DIR/models/crop_bed:$SCRIPT_DIR/models/survey_drone:$GZ_SIM_RESOURCE_PATH"

echo "🌿 Loading KissanVikas Smart Polyhouse in Gazebo Harmonic..."
gz sim -r -v 3 "$SCRIPT_DIR/worlds/polyhouse/polyhouse.sdf"
