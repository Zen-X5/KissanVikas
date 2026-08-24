"""
Generator script for the KissanVikas Polyhouse Gazebo World (polyhouse.sdf).
Organizes 48 commercial crop beds, plant rows, and zone indicator placards into 4 distinct production zones.
"""

def generate_polyhouse_world():
    sdf = []
    sdf.append('<?xml version="1.0" ?>')
    sdf.append('<sdf version="1.9">')
    sdf.append('  <world name="polyhouse_world">')
    sdf.append('    <!-- Physics Configuration -->')
    sdf.append('    <physics name="1ms" type="ignored">')
    sdf.append('      <max_step_size>0.001</max_step_size>')
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
    sdf.append('    <!-- Scene & Lighting -->')
    sdf.append('    <scene>')
    sdf.append('      <ambient>0.7 0.73 0.75 1.0</ambient>')
    sdf.append('      <background>0.7 0.85 0.95 1.0</background>')
    sdf.append('      <shadows>true</shadows>')
    sdf.append('      <grid>false</grid>')
    sdf.append('    </scene>')
    sdf.append('')
    sdf.append('    <!-- Sunlight -->')
    sdf.append('    <light type="directional" name="sun">')
    sdf.append('      <cast_shadows>true</cast_shadows>')
    sdf.append('      <pose>15 -20 35 0.5 0.3 -0.8</pose>')
    sdf.append('      <diffuse>0.92 0.92 0.88 1</diffuse>')
    sdf.append('      <specular>0.3 0.3 0.3 1</specular>')
    sdf.append('      <direction>-0.3 0.4 -0.85</direction>')
    sdf.append('    </light>')
    sdf.append('')
    sdf.append('    <!-- Secondary Fill Light inside Polyhouse -->')
    sdf.append('    <light type="directional" name="diffuse_sky">')
    sdf.append('      <cast_shadows>false</cast_shadows>')
    sdf.append('      <pose>0 0 20 0 0 0</pose>')
    sdf.append('      <diffuse>0.4 0.42 0.45 1</diffuse>')
    sdf.append('      <direction>0 0 -1</direction>')
    sdf.append('    </light>')
    sdf.append('')
    sdf.append('    <!-- Ground Plane & Surrounding Terrain -->')
    sdf.append('    <model name="ground_plane">')
    sdf.append('      <static>true</static>')
    sdf.append('      <link name="ground_link">')
    sdf.append('        <collision name="ground_collision">')
    sdf.append('          <geometry><plane><normal>0 0 1</normal><size>150 150</size></plane></geometry>')
    sdf.append('        </collision>')
    sdf.append('        <!-- Surrounding Farmland Surface -->')
    sdf.append('        <visual name="ground_visual">')
    sdf.append('          <geometry><plane><normal>0 0 1</normal><size>150 150</size></plane></geometry>')
    sdf.append('          <material>')
    sdf.append('            <ambient>0.32 0.45 0.25 1</ambient>')
    sdf.append('            <diffuse>0.38 0.52 0.3 1</diffuse>')
    sdf.append('            <roughness>0.9</roughness>')
    sdf.append('          </material>')
    sdf.append('        </visual>')
    sdf.append('        <!-- Polyhouse Internal Foundation Floor (60m x 30m) -->')
    sdf.append('        <visual name="polyhouse_floor">')
    sdf.append('          <pose>0 0 0.005 0 0 0</pose>')
    sdf.append('          <geometry><box><size>60.2 30.2 0.01</size></box></geometry>')
    sdf.append('          <material>')
    sdf.append('            <ambient>0.28 0.22 0.18 1</ambient>')
    sdf.append('            <diffuse>0.34 0.27 0.22 1</diffuse>')
    sdf.append('            <roughness>0.95</roughness>')
    sdf.append('          </material>')
    sdf.append('        </visual>')
    sdf.append('        <!-- Central Longitudinal Concrete Walkway (60m x 3m) -->')
    sdf.append('        <visual name="main_walkway_longitudinal">')
    sdf.append('          <pose>0 0 0.015 0 0 0</pose>')
    sdf.append('          <geometry><box><size>60.0 3.0 0.02</size></box></geometry>')
    sdf.append('          <material>')
    sdf.append('            <ambient>0.62 0.64 0.65 1</ambient>')
    sdf.append('            <diffuse>0.72 0.74 0.75 1</diffuse>')
    sdf.append('            <roughness>0.7</roughness>')
    sdf.append('          </material>')
    sdf.append('        </visual>')
    sdf.append('        <!-- Transverse Cross Walkway (3m x 30m) -->')
    sdf.append('        <visual name="main_walkway_transverse">')
    sdf.append('          <pose>0 0 0.016 0 0 0</pose>')
    sdf.append('          <geometry><box><size>3.0 30.0 0.02</size></box></geometry>')
    sdf.append('          <material>')
    sdf.append('            <ambient>0.62 0.64 0.65 1</ambient>')
    sdf.append('            <diffuse>0.72 0.74 0.75 1</diffuse>')
    sdf.append('            <roughness>0.7</roughness>')
    sdf.append('          </material>')
    sdf.append('        </visual>')
    sdf.append('      </link>')
    sdf.append('    </model>')
    sdf.append('')
    sdf.append('    <!-- ========================================== -->')
    sdf.append('    <!-- POLYHOUSE ARCHITECTURAL MODELS             -->')
    sdf.append('    <!-- ========================================== -->')
    sdf.append('    <!-- 1. Structural Steel Frame -->')
    sdf.append('    <include>')
    sdf.append('      <uri>model://polyhouse_structure</uri>')
    sdf.append('      <name>polyhouse_main</name>')
    sdf.append('      <pose>0 0 0 0 0 0</pose>')
    sdf.append('    </include>')
    sdf.append('')
    sdf.append('    <!-- 2. Translucent Greenhouse Polyethylene Cladding -->')
    sdf.append('    <include>')
    sdf.append('      <uri>model://polyhouse_covering</uri>')
    sdf.append('      <name>polyhouse_covering_main</name>')
    sdf.append('      <pose>0 0 0 0 0 0</pose>')
    sdf.append('    </include>')
    sdf.append('')
    sdf.append('    <!-- 3. Rooftop Ventilation System -->')
    sdf.append('    <include>')
    sdf.append('      <uri>model://rooftop_ventilation</uri>')
    sdf.append('      <name>polyhouse_ventilation_system</name>')
    sdf.append('      <pose>0 0 0 0 0 0</pose>')
    sdf.append('    </include>')
    sdf.append('')

    # Zones definition
    zones = [
        {
            'name': 'tomato',
            'crop_model': 'tomato_plant',
            'x_centers': [-20.5, -8.5],
            'y_centers': [3.5, 5.5, 7.5, 9.5, 11.5, 13.5],
            'zone_id': 'tomato_zone_01',
            'bed_prefix': 'tomato_bed',
            'color': '0.9 0.1 0.1' # Red marker
        },
        {
            'name': 'capsicum',
            'crop_model': 'capsicum_plant',
            'x_centers': [8.5, 20.5],
            'y_centers': [3.5, 5.5, 7.5, 9.5, 11.5, 13.5],
            'zone_id': 'capsicum_zone_01',
            'bed_prefix': 'capsicum_bed',
            'color': '0.95 0.7 0.05' # Yellow/Orange marker
        },
        {
            'name': 'cucumber',
            'crop_model': 'cucumber_plant',
            'x_centers': [-20.5, -8.5],
            'y_centers': [-13.5, -11.5, -9.5, -7.5, -5.5, -3.5],
            'zone_id': 'cucumber_zone_01',
            'bed_prefix': 'cucumber_bed',
            'color': '0.1 0.8 0.1' # Green/Yellow flower marker
        },
        {
            'name': 'eggplant',
            'crop_model': 'eggplant_plant',
            'x_centers': [8.5, 20.5],
            'y_centers': [-13.5, -11.5, -9.5, -7.5, -5.5, -3.5],
            'zone_id': 'eggplant_zone_01',
            'bed_prefix': 'eggplant_bed',
            'color': '0.45 0.08 0.65' # Purple marker
        }
    ]

    for zone in zones:
        sdf.append(f"    <!-- ========================================== -->")
        sdf.append(f"    <!-- ZONE: {zone['zone_id'].upper()} ({zone['name'].upper()}) -->")
        sdf.append(f"    <!-- ========================================== -->")
        bed_count = 1
        for y in zone['y_centers']:
            for x in zone['x_centers']:
                bed_name = f"{zone['bed_prefix']}_{bed_count:03d}"
                # Crop Bed
                sdf.append(f"    <include>")
                sdf.append(f"      <uri>model://crop_bed</uri>")
                sdf.append(f"      <name>{bed_name}</name>")
                sdf.append(f"      <pose>{x:.1f} {y:.1f} 0 0 0 0</pose>")
                sdf.append(f"    </include>")

                # Plant rows along the 11.5m bed (spaced every 1.25m from -4.5 to +4.5 in local X, 8 plants per bed)
                plant_offsets = [-4.5, -3.2, -1.9, -0.6, 0.7, 2.0, 3.3, 4.5]
                for p_idx, p_x in enumerate(plant_offsets, 1):
                    plant_global_x = x + p_x
                    plant_name = f"{bed_name}_p{p_idx:02d}"
                    sdf.append(f"    <include>")
                    sdf.append(f"      <uri>model://{zone['crop_model']}</uri>")
                    sdf.append(f"      <name>{plant_name}</name>")
                    sdf.append(f"      <pose>{plant_global_x:.2f} {y:.1f} 0.25 0 0 0</pose>")
                    sdf.append(f"    </include>")

                bed_count += 1
                sdf.append("")

    sdf.append('  </world>')
    sdf.append('</sdf>')
    return '\n'.join(sdf)

if __name__ == '__main__':
    content = generate_polyhouse_world()
    with open('d:/KissanVikas/simulation/worlds/polyhouse/polyhouse.sdf', 'w') as f:
        f.write(content)
    print("polyhouse.sdf regenerated successfully with enhanced density!")
