"""
Control:
    Execute a learned policy. Takes the most recent observation from mobile robot,
    computes a response and sends it to the robot.

    Example Usage:
        python main.py auto control --all


Maps:
    Generate maps based on 3D building geometry

    Example Usage:
        python main.py maps


Observe:
    Observation Generator
    Generate observations for a particular building
    Observations are published as fast soon as they are generated (10Hz)
    Observations are publised to 'robots.events.observation'

    Example Usage:
        python main.py observe 5dc3dee819dfb1717a23fad9
        python main.py observe 5dc3dee819dfb1717a23fad9 --verbosity=1


Simulate:
    Building Simulator
    Generate observations for a particular building
    Observations are published as fast soon as they are generated (10Hz)
    Observations are publised to 'robots.events.observation'

    Example Usage:
        python main.py simulate 5dc3dee819dfb1717a23fad9
        python main.py simulate 5dc3dee819dfb1717a23fad9 --verbosity=1 --render
"""

import os
import math
import time
import yaml
import json
import urllib
import shutil
import logging
import argparse
from config import config
from simulate.simulator import Simulator
from simulate.environment import Environment as SimulatorEnvironment
from auto.src.services.observation import ObservationGenerator
from maps.main import MapBuilder

logging.basicConfig(format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)

parser = argparse.ArgumentParser(description='Run services.')
subparsers = parser.add_subparsers(help='sub-command help')

observe_parser = subparsers.add_parser('observe', help='Create observations for building')
observe_parser.add_argument('building_id', type=str, help='Building Id')
observe_parser.add_argument('--config', type=str, default="prod", help='Api Configuration')
observe_parser.add_argument('--verbosity', type=int, default=0, help='Logging verbosity')

map_parser = subparsers.add_parser('maps', help='Generate maps for every building')
map_parser.add_argument('--height', type=float, default=0.1, help='height to generate map')
map_parser.add_argument('--config', type=str, default="prod", help='Api Configuration')
map_parser.add_argument('--verbosity', type=int, default=0, help='Logging verbosity')

simulate_parser = subparsers.add_parser('simulate', help='Simulate the movement of robots in the building')
simulate_parser.add_argument('building_id', type=str, help='Building Id')
simulate_parser.add_argument('--config', type=str, default="prod", help='Api Configuration')
simulate_parser.add_argument('--render', action="store_true", default=False, help='Display the environment')


def observe_subcommand(args, api_config):
    """
    Observe Subcommand
    """
    print("Creating Observation generator for ", args.building_id)
    service = ObservationGenerator(args.building_id, verbosity=args.verbosity)
    service.run()


def maps_subcommand(args, api_config):
    """
    Maps Subcommand
    """
    print("Generating maps")
    builder = MapBuilder(args.height, api_config)
    builder.run()


def simulate_subcommand(args, api_config):
    """
    Simulate Subcommand
    """
    print("Simulation subcommand")
    headless = not args.render
    env = SimulatorEnvironment(args.building_id, headless=headless)
    simulator = Simulator(env, api_config)
    simulator.run()





def main():
    """
    Main entrypoint
    """
    observe_parser.set_defaults(function=observe_subcommand)
    map_parser.set_defaults(function=maps_subcommand)
    simulate_parser.set_defaults(function=simulate_subcommand)
    args = parser.parse_args()
    
    if args.config == "prod":
        api_config = config.prod
    elif args.config == "dev":
        api_config = config.dev
    else:
        raise ValueError("No such config: ", api_config)
    args.function(args, api_config)


if __name__=="__main__":
    main()


