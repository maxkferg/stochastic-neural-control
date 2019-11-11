import colored_traceback
from ray import tune
from pprint import pprint
from ray.rllib.models import ModelCatalog
from .agents.sacq import SACQAgent
from .learning.robot import RobotModel
from .learning.sensor import SensorModel
from .environment.sensor import SensorEnvironment # Env type
from .environment.multi import MultiEnvironment # Env type
colored_traceback.add_hook()
    

def train_env_factory():
    """
    Create an environment that is linked to the communication platform
    Returns a factory function for creating environments
    """
    ncreated = 0
    def train_env_creator(config):
        nonlocal ncreated
        if ncreated == 0:
            print("Creating environment with parameters:")
            pprint(config)
            print()
        ncreated += 1
        return MultiEnvironment(config=config, environment_cls=SensorEnvironment)
    return train_env_creator



# Register all the custom env
print("Registering SACQAgent and custom environments")
ModelCatalog.register_custom_model("robot", RobotModel)
ModelCatalog.register_custom_model("sensor", SensorModel)
tune.register_trainable("SACQ", SACQAgent)
tune.register_env("MultiRobot-v0", train_env_factory())

