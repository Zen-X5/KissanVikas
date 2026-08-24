"""
Launch file for KissanVikas Survey Drone Simulation and Real 3D Camera Bridge.
Launches Gazebo Harmonic polyhouse world and bridges the camera image topic to ROS 2 / Web.
"""
import os
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, ExecuteProcess, SetEnvironmentVariable
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node

def generate_launch_description():
    pkg_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    world_path = os.path.join(pkg_dir, "worlds", "polyhouse", "polyhouse.sdf")
    models_path = f"{pkg_dir}/models:{pkg_dir}/models/crop_beds:{pkg_dir}/models/crops:{pkg_dir}/models/survey_drone"

    set_env = SetEnvironmentVariable(
        name="GZ_SIM_RESOURCE_PATH",
        value=models_path
    )

    # 1. Gazebo Harmonic Simulation World
    gz_sim = ExecuteProcess(
        cmd=["gz", "sim", "-r", "-v", "3", world_path],
        output="screen"
    )

    # 2. ROS 2 <-> Gazebo Bridge for 3D Camera & Odometry
    bridge_node = Node(
        package="ros_gz_bridge",
        executable="parameter_bridge",
        name="kissanvikas_camera_bridge",
        arguments=[
            "/kissanvikas/drone/camera/image_raw@sensor_msgs/msg/Image[gz.msgs.Image",
            "/kissanvikas/drone/cmd_vel@geometry_msgs/msg/Twist]gz.msgs.Twist",
            "/kissanvikas/drone/odometry@nav_msgs/msg/Odometry[gz.msgs.Odometry",
        ],
        output="screen"
    )

    return LaunchDescription([
        set_env,
        gz_sim,
        bridge_node,
    ])
