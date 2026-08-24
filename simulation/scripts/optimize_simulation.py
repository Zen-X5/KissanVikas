"""
Optimized Model and World Generator for KissanVikas Simulation.
Batches plant visuals directly into 4 specialized crop bed models:
  - models/crop_beds/tomato_bed/
  - models/crop_beds/capsicum_bed/
  - models/crop_beds/cucumber_bed/
  - models/crop_beds/eggplant_bed/
This reduces Gazebo entities from ~450 separate models to just 48 models,
drastically reducing draw calls and giving smooth 60+ FPS inside WSL.
"""
import os

def create_model_config(path, name, desc):
    os.makedirs(path, exist_ok=True)
    content = f"""<?xml version="1.0"?>
<model>
  <name>{name}</name>
  <version>1.0</version>
  <sdf version="1.9">model.sdf</sdf>
  <author>
    <name>KissanVikas Team</name>
    <email>dev@kissanvikas.com</email>
  </author>
  <description>{desc}</description>
</model>
"""
    with open(os.path.join(path, "model.config"), "w") as f:
        f.write(content)

def generate_batched_bed_sdf(crop_type):
    offsets = [-4.5, -3.2, -1.9, -0.6, 0.7, 2.0, 3.3, 4.5]
    sdf = ['<?xml version="1.0" ?>', '<sdf version="1.9">']
    sdf.append(f'  <model name="{crop_type}_bed">')
    sdf.append('    <static>true</static>')
    sdf.append('    <link name="bed_link">')
    sdf.append('      <pose>0 0 0 0 0 0</pose>')
    
    # 1. Base Bed Visuals (Soil, mulch, border)
    sdf.append('      <!-- Raised Bed Soil & Structure -->')
    sdf.append('      <visual name="soil_surface">')
    sdf.append('        <pose>0 0 0.12 0 0 0</pose>')
    sdf.append('        <geometry><box><size>11.4 1.1 0.22</size></box></geometry>')
    sdf.append('        <material><ambient>0.2 0.14 0.09 1</ambient><diffuse>0.26 0.18 0.12 1</diffuse></material>')
    sdf.append('      </visual>')
    sdf.append('      <visual name="mulch_strip">')
    sdf.append('        <pose>0 0 0.235 0 0 0</pose>')
    sdf.append('        <geometry><box><size>11.3 0.95 0.01</size></box></geometry>')
    sdf.append('        <material><ambient>0.1 0.1 0.1 1</ambient><diffuse>0.15 0.15 0.15 1</diffuse></material>')
    sdf.append('      </visual>')
    sdf.append('      <visual name="border_left">')
    sdf.append('        <pose>0 -0.58 0.125 0 0 0</pose>')
    sdf.append('        <geometry><box><size>11.5 0.06 0.25</size></box></geometry>')
    sdf.append('        <material><ambient>0.45 0.47 0.5 1</ambient><diffuse>0.55 0.57 0.6 1</diffuse></material>')
    sdf.append('      </visual>')
    sdf.append('      <visual name="border_right">')
    sdf.append('        <pose>0 0.58 0.125 0 0 0</pose>')
    sdf.append('        <geometry><box><size>11.5 0.06 0.25</size></box></geometry>')
    sdf.append('        <material><ambient>0.45 0.47 0.5 1</ambient><diffuse>0.55 0.57 0.6 1</diffuse></material>')
    sdf.append('      </visual>')

    # 2. Integrated Plants along the Bed
    for i, ox in enumerate(offsets, 1):
        if crop_type == 'tomato':
            # Trellis stake
            sdf.append(f'      <visual name="stake_{i}"><pose>{ox} 0 1.05 0 0 0</pose><geometry><cylinder><radius>0.015</radius><length>1.7</length></cylinder></geometry><material><ambient>0.7 0.6 0.45 1</ambient><diffuse>0.8 0.68 0.5 1</diffuse></material></visual>')
            # Canopy layers
            sdf.append(f'      <visual name="canopy_low_{i}"><pose>{ox} 0 0.65 0 0 0.78</pose><geometry><box><size>0.65 0.65 0.35</size></box></geometry><material><ambient>0.15 0.48 0.15 1</ambient><diffuse>0.22 0.58 0.22 1</diffuse></material></visual>')
            sdf.append(f'      <visual name="canopy_mid_{i}"><pose>{ox} 0 1.1 0 0 0.35</pose><geometry><box><size>0.68 0.68 0.4</size></box></geometry><material><ambient>0.18 0.52 0.18 1</ambient><diffuse>0.26 0.65 0.26 1</diffuse></material></visual>')
            sdf.append(f'      <visual name="canopy_top_{i}"><pose>{ox} 0 1.55 0 0 1.1</pose><geometry><box><size>0.55 0.55 0.35</size></box></geometry><material><ambient>0.2 0.58 0.2 1</ambient><diffuse>0.3 0.72 0.3 1</diffuse></material></visual>')
            # Tomatoes (Top, Mid, Low)
            sdf.append(f'      <visual name="fruit_top_{i}"><pose>{ox+0.16} 0.15 1.5 0 0 0</pose><geometry><sphere><radius>0.08</radius></sphere></geometry><material><ambient>0.9 0.06 0.06 1</ambient><diffuse>0.98 0.1 0.1 1</diffuse></material></visual>')
            sdf.append(f'      <visual name="fruit_mid_{i}"><pose>{ox-0.18} -0.15 1.1 0 0 0</pose><geometry><sphere><radius>0.085</radius></sphere></geometry><material><ambient>0.9 0.06 0.06 1</ambient><diffuse>0.98 0.1 0.1 1</diffuse></material></visual>')
            sdf.append(f'      <visual name="fruit_low_{i}"><pose>{ox+0.18} -0.18 0.7 0 0 0</pose><geometry><sphere><radius>0.08</radius></sphere></geometry><material><ambient>0.88 0.08 0.08 1</ambient><diffuse>0.95 0.12 0.12 1</diffuse></material></visual>')
            # Yellow blossoms
            sdf.append(f'      <visual name="blossom_{i}"><pose>{ox-0.12} 0.2 1.6 0 0 0</pose><geometry><sphere><radius>0.04</radius></sphere></geometry><material><ambient>0.98 0.9 0.1 1</ambient><diffuse>1.0 0.95 0.15 1</diffuse></material></visual>')

        elif crop_type == 'capsicum':
            # Wide bushy canopy
            sdf.append(f'      <visual name="canopy_low_{i}"><pose>{ox} 0 0.55 0 0 0.4</pose><geometry><box><size>0.8 0.8 0.32</size></box></geometry><material><ambient>0.06 0.35 0.08 1</ambient><diffuse>0.1 0.45 0.12 1</diffuse></material></visual>')
            sdf.append(f'      <visual name="canopy_top_{i}"><pose>{ox} 0 0.82 0 0 1.2</pose><geometry><box><size>0.68 0.68 0.36</size></box></geometry><material><ambient>0.08 0.4 0.1 1</ambient><diffuse>0.14 0.52 0.15 1</diffuse></material></visual>')
            # Red pepper
            sdf.append(f'      <visual name="pep_red_{i}"><pose>{ox+0.16} 0.14 0.9 0 0 0.3</pose><geometry><box><size>0.12 0.12 0.14</size></box></geometry><material><ambient>0.9 0.05 0.05 1</ambient><diffuse>0.98 0.08 0.08 1</diffuse></material></visual>')
            # Yellow pepper
            sdf.append(f'      <visual name="pep_yel_{i}"><pose>{ox-0.16} -0.15 0.88 0 0 0.8</pose><geometry><box><size>0.12 0.12 0.14</size></box></geometry><material><ambient>0.95 0.8 0.05 1</ambient><diffuse>1.0 0.9 0.1 1</diffuse></material></visual>')
            # Orange pepper
            sdf.append(f'      <visual name="pep_org_{i}"><pose>{ox-0.18} 0.16 0.7 0 0 0.4</pose><geometry><box><size>0.11 0.11 0.13</size></box></geometry><material><ambient>0.92 0.48 0.05 1</ambient><diffuse>0.98 0.58 0.08 1</diffuse></material></visual>')

        elif crop_type == 'cucumber':
            # Climbing trellis
            sdf.append(f'      <visual name="stake_l_{i}"><pose>{ox} -0.2 0.95 0.15 0 0</pose><geometry><box><size>0.02 0.02 1.55</size></box></geometry><material><ambient>0.7 0.7 0.7 1</ambient><diffuse>0.8 0.8 0.8 1</diffuse></material></visual>')
            sdf.append(f'      <visual name="stake_r_{i}"><pose>{ox} 0.2 0.95 -0.15 0 0</pose><geometry><box><size>0.02 0.02 1.55</size></box></geometry><material><ambient>0.7 0.7 0.7 1</ambient><diffuse>0.8 0.8 0.8 1</diffuse></material></visual>')
            # Lime green canopy
            sdf.append(f'      <visual name="canopy_low_{i}"><pose>{ox} 0 0.65 0 0 0.5</pose><geometry><box><size>0.75 0.75 0.32</size></box></geometry><material><ambient>0.2 0.55 0.15 1</ambient><diffuse>0.28 0.7 0.22 1</diffuse></material></visual>')
            sdf.append(f'      <visual name="canopy_top_{i}"><pose>{ox} 0 1.35 0 0 0.2</pose><geometry><box><size>0.6 0.6 0.32</size></box></geometry><material><ambient>0.25 0.62 0.2 1</ambient><diffuse>0.35 0.8 0.28 1</diffuse></material></visual>')
            # Yellow flowers
            sdf.append(f'      <visual name="cuc_flower_1_{i}"><pose>{ox+0.18} 0.16 1.45 0 0 0</pose><geometry><sphere><radius>0.07</radius></sphere></geometry><material><ambient>0.98 0.9 0.05 1</ambient><diffuse>1.0 0.95 0.1 1</diffuse></material></visual>')
            sdf.append(f'      <visual name="cuc_flower_2_{i}"><pose>{ox-0.16} -0.14 1.42 0 0 0</pose><geometry><sphere><radius>0.065</radius></sphere></geometry><material><ambient>0.98 0.9 0.05 1</ambient><diffuse>1.0 0.95 0.1 1</diffuse></material></visual>')
            # Dark green cucumbers
            sdf.append(f'      <visual name="cuc_fruit_1_{i}"><pose>{ox+0.2} 0.12 0.85 0 0 0</pose><geometry><cylinder><radius>0.04</radius><length>0.34</length></cylinder></geometry><material><ambient>0.05 0.28 0.05 1</ambient><diffuse>0.08 0.38 0.08 1</diffuse></material></visual>')
            sdf.append(f'      <visual name="cuc_fruit_2_{i}"><pose>{ox-0.2} -0.14 0.9 0 0 0</pose><geometry><cylinder><radius>0.038</radius><length>0.32</length></cylinder></geometry><material><ambient>0.05 0.28 0.05 1</ambient><diffuse>0.08 0.38 0.08 1</diffuse></material></visual>')

        elif crop_type == 'eggplant':
            # Velvety olive canopy
            sdf.append(f'      <visual name="canopy_low_{i}"><pose>{ox} 0 0.6 0 0 0.8</pose><geometry><box><size>0.82 0.82 0.32</size></box></geometry><material><ambient>0.2 0.32 0.18 1</ambient><diffuse>0.28 0.42 0.24 1</diffuse></material></visual>')
            sdf.append(f'      <visual name="canopy_top_{i}"><pose>{ox} 0 0.95 0 0 0.2</pose><geometry><box><size>0.7 0.7 0.36</size></box></geometry><material><ambient>0.24 0.36 0.2 1</ambient><diffuse>0.32 0.48 0.28 1</diffuse></material></visual>')
            # Large purple eggplants
            sdf.append(f'      <visual name="egg_top_{i}"><pose>{ox+0.18} 0.14 0.85 0.3 0 0</pose><geometry><cylinder><radius>0.085</radius><length>0.26</length></cylinder></geometry><material><ambient>0.2 0.02 0.38 1</ambient><diffuse>0.32 0.04 0.58 1</diffuse></material></visual>')
            sdf.append(f'      <visual name="egg_calyx_{i}"><pose>{ox+0.18} 0.14 0.98 0 0 0</pose><geometry><cylinder><radius>0.05</radius><length>0.05</length></cylinder></geometry><material><ambient>0.2 0.5 0.2 1</ambient><diffuse>0.28 0.65 0.28 1</diffuse></material></visual>')
            sdf.append(f'      <visual name="egg_mid_{i}"><pose>{ox-0.2} -0.16 0.75 -0.3 0 0</pose><geometry><cylinder><radius>0.08</radius><length>0.25</length></cylinder></geometry><material><ambient>0.2 0.02 0.38 1</ambient><diffuse>0.32 0.04 0.58 1</diffuse></material></visual>')

    # Single unified collision box per bed (zero physics lag)
    sdf.append('      <!-- Single Bed Physics Collision -->')
    sdf.append('      <collision name="bed_col">')
    sdf.append('        <pose>0 0 0.5 0 0 0</pose>')
    sdf.append('        <geometry><box><size>11.5 1.2 1.0</size></box></geometry>')
    sdf.append('      </collision>')
    sdf.append('    </link>')
    sdf.append('  </model>')
    sdf.append('</sdf>')
    return '\n'.join(sdf)

def generate_optimized_world():
    sdf = []
    sdf.append('<?xml version="1.0" ?>')
    sdf.append('<sdf version="1.9">')
    sdf.append('  <world name="polyhouse_world">')
    sdf.append('    <!-- Physics Configuration (Fast & Smooth) -->')
    sdf.append('    <physics name="1ms" type="ignored">')
    sdf.append('      <max_step_size>0.002</max_step_size>')
    sdf.append('      <real_time_factor>1.0</real_time_factor>')
    sdf.append('    </physics>')
    sdf.append('')
    sdf.append('    <!-- Plugins for Gazebo Harmonic -->')
    sdf.append('    <plugin filename="gz-sim-physics-system" name="gz::sim::systems::Physics" />')
    sdf.append('    <plugin filename="gz-sim-user-commands-system" name="gz::sim::systems::UserCommands" />')
    sdf.append('    <plugin filename="gz-sim-scene-broadcaster-system" name="gz::sim::systems::SceneBroadcaster" />')
    sdf.append('    <plugin filename="gz-sim-sensors-system" name="gz::sim::systems::Sensors">')
    sdf.append('      <render_engine>ogre2</render_engine>')
    sdf.append('    </plugin>')
    sdf.append('')
    sdf.append('    <!-- Scene & Optimized Lighting (No multi-pass shadow lag) -->')
    sdf.append('    <scene>')
    sdf.append('      <ambient>0.75 0.78 0.8 1.0</ambient>')
    sdf.append('      <background>0.7 0.85 0.95 1.0</background>')
    sdf.append('      <shadows>false</shadows>')
    sdf.append('      <grid>false</grid>')
    sdf.append('    </scene>')
    sdf.append('')
    sdf.append('    <!-- Directional Sun (Fast) -->')
    sdf.append('    <light type="directional" name="sun">')
    sdf.append('      <cast_shadows>false</cast_shadows>')
    sdf.append('      <pose>15 -20 35 0.5 0.3 -0.8</pose>')
    sdf.append('      <diffuse>0.92 0.92 0.88 1</diffuse>')
    sdf.append('      <specular>0.2 0.2 0.2 1</specular>')
    sdf.append('      <direction>-0.3 0.4 -0.85</direction>')
    sdf.append('    </light>')
    sdf.append('')
    sdf.append('    <!-- Ground Plane & Walkways -->')
    sdf.append('    <model name="ground_plane">')
    sdf.append('      <static>true</static>')
    sdf.append('      <link name="ground_link">')
    sdf.append('        <collision name="ground_collision">')
    sdf.append('          <geometry><plane><normal>0 0 1</normal><size>150 150</size></plane></geometry>')
    sdf.append('        </collision>')
    sdf.append('        <visual name="ground_visual">')
    sdf.append('          <geometry><plane><normal>0 0 1</normal><size>150 150</size></plane></geometry>')
    sdf.append('          <material><ambient>0.32 0.45 0.25 1</ambient><diffuse>0.38 0.52 0.3 1</diffuse></material>')
    sdf.append('        </visual>')
    sdf.append('        <visual name="polyhouse_floor">')
    sdf.append('          <pose>0 0 0.005 0 0 0</pose>')
    sdf.append('          <geometry><box><size>60.2 30.2 0.01</size></box></geometry>')
    sdf.append('          <material><ambient>0.28 0.22 0.18 1</ambient><diffuse>0.34 0.27 0.22 1</diffuse></material>')
    sdf.append('        </visual>')
    sdf.append('        <visual name="main_walkway_longitudinal">')
    sdf.append('          <pose>0 0 0.015 0 0 0</pose>')
    sdf.append('          <geometry><box><size>60.0 3.0 0.02</size></box></geometry>')
    sdf.append('          <material><ambient>0.65 0.67 0.68 1</ambient><diffuse>0.75 0.77 0.78 1</diffuse></material>')
    sdf.append('        </visual>')
    sdf.append('        <visual name="main_walkway_transverse">')
    sdf.append('          <pose>0 0 0.016 0 0 0</pose>')
    sdf.append('          <geometry><box><size>3.0 30.0 0.02</size></box></geometry>')
    sdf.append('          <material><ambient>0.65 0.67 0.68 1</ambient><diffuse>0.75 0.77 0.78 1</diffuse></material>')
    sdf.append('        </visual>')
    sdf.append('      </link>')
    sdf.append('    </model>')
    sdf.append('')
    sdf.append('    <!-- Polyhouse Structures -->')
    sdf.append('    <include><uri>model://polyhouse_structure</uri><name>polyhouse_main</name><pose>0 0 0 0 0 0</pose></include>')
    sdf.append('    <include><uri>model://polyhouse_covering</uri><name>polyhouse_covering_main</name><pose>0 0 0 0 0 0</pose></include>')
    sdf.append('    <include><uri>model://rooftop_ventilation</uri><name>polyhouse_ventilation_system</name><pose>0 0 0 0 0 0</pose></include>')
    sdf.append('')
    sdf.append('    <!-- Survey Quadcopter Drone (Spawned at Takeoff Pad) -->')
    sdf.append('    <include><uri>model://survey_drone</uri><name>survey_drone</name><pose>-33.0 0 0.1 0 0 0</pose></include>')
    sdf.append('')
    
    # Zones with Batched Models
    zones = [
        {
            'zone_id': 'tomato_zone_01',
            'bed_model': 'tomato_bed',
            'x_centers': [-20.5, -8.5],
            'y_centers': [3.5, 5.5, 7.5, 9.5, 11.5, 13.5],
            'bed_prefix': 'tomato_bed'
        },
        {
            'zone_id': 'capsicum_zone_01',
            'bed_model': 'capsicum_bed',
            'x_centers': [8.5, 20.5],
            'y_centers': [3.5, 5.5, 7.5, 9.5, 11.5, 13.5],
            'bed_prefix': 'capsicum_bed'
        },
        {
            'zone_id': 'cucumber_zone_01',
            'bed_model': 'cucumber_bed',
            'x_centers': [-20.5, -8.5],
            'y_centers': [-13.5, -11.5, -9.5, -7.5, -5.5, -3.5],
            'bed_prefix': 'cucumber_bed'
        },
        {
            'zone_id': 'eggplant_zone_01',
            'bed_model': 'eggplant_bed',
            'x_centers': [8.5, 20.5],
            'y_centers': [-13.5, -11.5, -9.5, -7.5, -5.5, -3.5],
            'bed_prefix': 'eggplant_bed'
        }
    ]

    for zone in zones:
        sdf.append(f"    <!-- ========================================== -->")
        sdf.append(f"    <!-- ZONE: {zone['zone_id'].upper()} -->")
        sdf.append(f"    <!-- ========================================== -->")
        bed_count = 1
        for y in zone['y_centers']:
            for x in zone['x_centers']:
                bed_name = f"{zone['bed_prefix']}_{bed_count:03d}"
                sdf.append(f"    <include>")
                sdf.append(f"      <uri>model://{zone['bed_model']}</uri>")
                sdf.append(f"      <name>{bed_name}</name>")
                sdf.append(f"      <pose>{x:.1f} {y:.1f} 0 0 0 0</pose>")
                sdf.append(f"    </include>")
                bed_count += 1
        sdf.append("")

    sdf.append('  </world>')
    sdf.append('</sdf>')
    return '\n'.join(sdf)

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    crops = ['tomato', 'capsicum', 'cucumber', 'eggplant']
    
    # Generate 4 batched bed models
    for c in crops:
        m_dir = os.path.join(base_dir, 'models', 'crop_beds', f'{c}_bed')
        create_model_config(m_dir, f'{c}_bed', f'Batched {c.capitalize()} Growing Bed')
        sdf_content = generate_batched_bed_sdf(c)
        with open(os.path.join(m_dir, 'model.sdf'), 'w') as f:
            f.write(sdf_content)
        print(f"Created model: {c}_bed")

    # Generate world file
    w_content = generate_optimized_world()
    world_path = os.path.join(base_dir, 'worlds', 'polyhouse', 'polyhouse.sdf')
    with open(world_path, 'w') as f:
        f.write(w_content)
    print(f"Updated {world_path} with 48 batched bed models (Optimized 60+ FPS)!")
