import pybullet as p

def get_odom_message(robot_id, pos, orn):
    """
    Return the ROS style odom message
    @robot_id: The robot that generated this message
    @pos: The position on (x,y,z) coordinates
    @orn: The orientation as a Quaternion (x,y,z,w)  
    """
    return {
        "robot": {
            "id": robot_id
        },
        "twist": {
            "header": {
                "stamp": {
                    "secs": 1564360742, 
                    "nsecs": 211769327
                }, 
                "frame_id": "odom",
                "seq": 681
            }, 
            "twist": {
                "linear": {
                    "y": 0.0,
                    "x": 0.0,
                    "z": 0.0
                }, 
                "angular": {
                    "y": 0.0,
                    "x": 0.0,
                    "z": 0.0
                }
            }, 
            "covariance": [
                0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
            ]
        }, 
        "pose": {
            "pose": {
                "position": {
                    "x": pos[0],
                    "y": pos[1], 
                    "z": pos[2]
                }, 
                "orientation": {
                    "x": orn[0], 
                    "y": orn[1], 
                    "z": orn[2], 
                    "w": orn[3]
                }
            }, 
            "covariance": [
                0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 10000000000.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 10000000000.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 10000000000.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.05
            ]
        }, 
        "child_frame_id": "base_footprint"
    }