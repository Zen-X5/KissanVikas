import os
from ament_index_python.packages import get_package_share_directory, PackageNotFoundError
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, ExecuteProcess, SetEnvironmentVariable
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution

def generate_launch_description():
    # 1. Locate package or fallback to source directory
    try:
        pkg_share = get_package_share_directory('kissanvikas_sim')
        models_dir = os.path.join(pkg_share, 'models')
        crops_dir = os.path.join(pkg_share, 'models', 'crops')
        crop_beds_dir = os.path.join(pkg_share, 'models', 'crop_beds')
        world_file = os.path.join(pkg_share, 'worlds', 'polyhouse', 'polyhouse.sdf')
    except PackageNotFoundError:
        # Source directory fallback (allows launching directly from workspace)
        src_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        models_dir = os.path.join(src_dir, 'models')
        crops_dir = os.path.join(src_dir, 'models', 'crops')
        crop_beds_dir = os.path.join(src_dir, 'models', 'crop_beds')
        world_file = os.path.join(src_dir, 'worlds', 'polyhouse', 'polyhouse.sdf')

    # 2. Configure Gazebo resource paths
    existing_resource_path = os.environ.get('GZ_SIM_RESOURCE_PATH', '')
    new_resource_path = f"{models_dir}:{crops_dir}:{crop_beds_dir}:{existing_resource_path}".strip(':')

    set_gz_resource_path = SetEnvironmentVariable(
        name='GZ_SIM_RESOURCE_PATH',
        value=new_resource_path
    )

    # For compatibility with ignition / legacy gazebo environment variables
    set_ign_resource_path = SetEnvironmentVariable(
        name='IGN_GAZEBO_RESOURCE_PATH',
        value=new_resource_path
    )

    set_gz_file_path = SetEnvironmentVariable(
        name='GZ_FILE_PATH',
        value=new_resource_path
    )

    # 3. Declare launch arguments
    declare_world_arg = DeclareLaunchArgument(
        'world',
        default_value=world_file,
        description='Full path to polyhouse SDF world file'
    )

    declare_headless_arg = DeclareLaunchArgument(
        'headless',
        default_value='false',
        description='Launch Gazebo Harmonic in headless server mode'
    )

    world_arg = LaunchConfiguration('world')

    # 4. Gazebo Sim Process (Gazebo Harmonic: `gz sim`)
    gz_sim_cmd = [
        'gz', 'sim',
        '-r', # Run simulation on start
        '-v', '3', # Verbosity
        world_arg
    ]

    gz_sim_process = ExecuteProcess(
        cmd=gz_sim_cmd,
        output='screen',
        additional_env={
            'GZ_SIM_RESOURCE_PATH': new_resource_path,
            'IGN_GAZEBO_RESOURCE_PATH': new_resource_path,
            'GZ_FILE_PATH': new_resource_path
        }
    )

    return LaunchDescription([
        set_gz_resource_path,
        set_ign_resource_path,
        set_gz_file_path,
        declare_world_arg,
        declare_headless_arg,
        gz_sim_process
    ])
