# 🌿 KissanVikas — Simulation Environment (Phase 1)

## 📌 Overview
This package (`kissanvikas_sim`) provides a commercial-scale ($60\text{ m} \times 30\text{ m} \times 6.5\text{ m}$), multi-bay Smart Polyhouse virtual world in **ROS 2 Jazzy** & **Gazebo Harmonic (Gazebo Sim)**. It serves as the physical simulation foundation for the **KissanVikas Digital Twin**.

---

## 🏗️ Polyhouse Architectural Specifications

- **Overall Dimensions**: Length = $60\text{ m}$ ($X \in [-30, +30]$), Width = $30\text{ m}$ ($Y \in [-15, +15]$), Height = $6.5\text{ m}$
- **Bays**: 3 connected structural bays ($10\text{ m}$ width each) with galvanized steel columns, trusses, and gutter rails.
- **Rooftop Ventilation**: 3 elevated continuous ridge ventilators ($58\text{ m}$ length each) along each bay apex with translucent vent louvers.
- **Envelope**: Translucent UV-stabilized greenhouse polyethylene covering on walls and roof.
- **Walkways**:
  - Longitudinal concrete logistics spine: $60\text{ m} \times 3\text{ m}$ along center $X$-axis ($Y \in [-1.5, +1.5]$).
  - Transverse cross-aisle: $30\text{ m} \times 3\text{ m}$ along center $Y$-axis ($X \in [-1.5, +1.5]$).
- **Entrances**: Dual $3.2\text{ m}$ wide doorway frames at $X = -30\text{ m}$ (West) and $X = +30\text{ m}$ (East).

---

## 🗺️ Internal Farm Layout & Digital Twin Zones

The polyhouse is structured into 4 distinct production quadrants containing **48 raised commercial crop beds** ($11.5\text{ m} \times 1.2\text{ m} \times 0.25\text{ m}$) populated with **336 individual crop plants**:

```
                       Polyhouse Top-Down Layout (60m x 30m)
 ┌──────────────────────────────────────┬──────────────────────────────────────┐
 │  ZONE A: TOMATOES                    │  ZONE B: CAPSICUM (BELL PEPPER)      │
 │  `tomato_zone_01`                    │  `capsicum_zone_01`                  │
 │  12 Beds (`tomato_bed_001` - `012`)  │  12 Beds (`capsicum_bed_001` - `012`)│
 │  🍅 🍅 🍅 🍅 🍅 🍅 🍅 🍅 🍅 🍅 🍅 🍅 │  🫑 🫑 🫑 🫑 🫑 🫑 🫑 🫑 🫑 🫑 🫑 🫑 │
 ├──────────────────────────────────────┼──────────────────────────────────────┤  ◄── Central Walkway (X-axis)
 │  ZONE C: CUCUMBERS                   │  ZONE D: EGGPLANTS (BRINJAL)         │
 │  `cucumber_zone_01`                  │  `eggplant_zone_01`                  │
 │  12 Beds (`cucumber_bed_001` - `012`)│  12 Beds (`eggplant_bed_001` - `012`)│
 │  🥒 🥒 🥒 🥒 🥒 🥒 🥒 🥒 🥒 🥒 🥒 🥒 │  🍆 🍆 🍆 🍆 🍆 🍆 🍆 🍆 🍆 🍆 🍆 🍆 │
 └──────────────────────────────────────┴──────────────────────────────────────┘
  ◄───────────────── 30m ───────────────►  ◄──────────────── 30m ───────────────►
```

### 🏷️ Digital Twin Identifier Reference Table

| Zone Identifier | Crop Type | Bed Naming Pattern | Plant Count / Bed | Visual Characteristics |
| :--- | :--- | :--- | :--- | :--- |
| `tomato_zone_01` | Tomato (*Solanum lycopersicum*) | `tomato_bed_001` ... `tomato_bed_012` | 7 plants (`_p01`–`_p07`) | Trellised $1.6\text{ m}$ vines, bamboo stakes, ripe red fruit clusters |
| `capsicum_zone_01` | Capsicum (*Capsicum annuum*) | `capsicum_bed_001` ... `capsicum_bed_012` | 7 plants (`_p01`–`_p07`) | Bushy $0.85\text{ m}$ canopy, glossy red and green bell peppers |
| `cucumber_zone_01` | Cucumber (*Cucumis sativus*) | `cucumber_bed_001` ... `cucumber_bed_012` | 7 plants (`_p01`–`_p07`) | Trellised $1.4\text{ m}$ vines, climbing stems, elongated dark green fruits |
| `eggplant_zone_01` | Eggplant (*Solanum melongena*) | `eggplant_bed_001` ... `eggplant_bed_012` | 7 plants (`_p01`–`_p07`) | Branching $0.95\text{ m}$ foliage, glossy deep-purple teardrop fruits |

---

## 📁 Package & Model Structure

```
simulation/
├── CMakeLists.txt                        # ROS 2 build manifest
├── package.xml                           # ROS 2 package configuration
├── README.md                             # Simulation documentation & guide
├── launch/
│   └── polyhouse_sim.launch.py           # Launch script for Gazebo Harmonic
├── models/
│   ├── crop_bed/                         # Reusable raised crop bed model
│   ├── polyhouse_structure/              # Reusable 3-bay steel frame model
│   ├── polyhouse_covering/               # Reusable translucent polyethylene cladding
│   ├── rooftop_ventilation/              # Reusable continuous ridge ventilators
│   └── crops/
│       ├── tomato_plant/                 # Reusable tomato model
│       ├── capsicum_plant/               # Reusable capsicum model
│       ├── cucumber_plant/               # Reusable cucumber model
│       └── eggplant_plant/               # Reusable eggplant model
├── scripts/
│   └── generate_world.py                 # Polyhouse world generator
└── worlds/
    └── polyhouse/
        └── polyhouse.sdf                 # Complete Gazebo Harmonic SDF world
```

---

## 🚀 Running the Simulation in WSL (Ubuntu 24.04)

### 1. Prerequisites (Ubuntu 24.04 / WSL2)

Make sure you have **ROS 2 Jazzy** and **Gazebo Harmonic** installed on your WSL distribution:

```bash
# 1. Install Gazebo Harmonic
sudo apt-get update
sudo apt-get install -y gz-harmonic ros-jazzy-ros-gz-sim ros-jazzy-ros-gz-bridge

# 2. Check WSL GUI (WSLg) graphics
glxinfo -B  # Should show D3D12 / hardware accelerated driver
```

### 2. Launching Gazebo

#### Method A: Direct Gazebo Sim (Fastest)

Navigate to your workspace in WSL and execute:

```bash
cd /mnt/d/KissanVikas/simulation

# Set model resource paths (includes batched crop beds for 60+ FPS)
export GZ_SIM_RESOURCE_PATH=$(pwd)/models:$(pwd)/models/crop_beds:$(pwd)/models/crops:$GZ_SIM_RESOURCE_PATH

# Launch Gazebo Harmonic directly
gz sim -r -v 3 worlds/polyhouse/polyhouse.sdf
```

#### Method B: ROS 2 Launch

```bash
# Source ROS 2 Jazzy
source /opt/ros/jazzy/setup.bash

# Run the launch file directly
python3 launch/polyhouse_sim.launch.py
```

#### Method C: Building with Colcon (Full ROS 2 Workspace)

```bash
mkdir -p ~/kissanvikas_ws/src
ln -s /mnt/d/KissanVikas/simulation ~/kissanvikas_ws/src/kissanvikas_sim

cd ~/kissanvikas_ws
colcon build --symlink-install
source install/setup.bash

# Launch via ROS 2 CLI
ros2 launch kissanvikas_sim polyhouse_sim.launch.py
```

---

## 🔍 Visual Inspection Guide

When Gazebo loads:
1. **Top-Down View**: Observe the full $60\text{ m} \times 30\text{ m}$ boundary, the central concrete cross-walkways, and the 4 distinct crop color zones (Red tomatoes, Red/Green peppers, Yellow-flowered cucumbers, Purple eggplants).
2. **Ground-Level Walkway View**: Walk down the central walkway ($Y = 0$) to see the raised beds, soil substrate, and plant heights on both sides.
3. **Roof & Ventilation View**: Look upward to verify the translucent greenhouse plastic roof slopes and the 3 continuous ridge ventilators along the bay peaks.

---

---

## 🚁 Step 1: Autonomous Survey Drone & Backend Data Contract (Bitupan → Moumita)

The simulator implements the exact 2-stage aerial survey protocol matching the data contracts:

### 1. Autonomous 2-Stage Flight Mission:
1. **Takeoff & Altitude Climb**: Drone ascends from pad (`-33.0m, 0.0m, 0.0m`) to survey altitude (`Z = 4.0m`).
2. **Stage 1 (`PERIMETER_SCAN`)**: Outer polyhouse exterior boundary circuit, calculating structural perimeter and capturing boundary survey frames.
3. **Stage 2 (`INTERIOR_SCAN`)**: High-resolution serpentine lawnmower scan through the polyhouse interior, covering all 48 crop beds in Zone A (Tomato), Zone B (Capsicum), Zone C (Cucumber), and Zone D (Eggplant).
4. **Landing & Mission Complete**: Drone returns to pad, lands, and emits comprehensive final summary statistics.

### 2. Dispatched Payloads & Topics:
- **Lifecycle Events**: `taking_off`, `perimeter_scan (started/completed)`, `interior_scan (started/completed)`, `landing`, `landed`, `completed`.
- **250ms Live Telemetry**: `position {x_m, y_m, z_m}`, `altitude_m`, `speed_mps`, `heading_deg`, `battery_percent`.
- **1080p Frame Capture**: `F-000001` ... `F-000097+` with camera pose, gimbal angles (`pitch = -60°`), and saved frame URLs in `/media/surveys/{mission_id}/`.

### 3. How to Run Autonomous Survey Mission:

```bash
cd /mnt/d/KissanVikas/simulation

# Run autonomous mission runner (streams telemetry + frames + events)
python3 src/mission/mission_runner.py --mission-id "66bc1234567890abcdef1234" --drone-id "DRONE-001"
```

To launch with Gazebo 3D Visualization:
```bash
# Export resource paths
export GZ_SIM_RESOURCE_PATH=$(pwd)/models:$(pwd)/models/crop_beds:$(pwd)/models/crops:$(pwd)/models/drone:$GZ_SIM_RESOURCE_PATH

# Launch Drone + Polyhouse world
python3 launch/drone_mission.launch.py
```
