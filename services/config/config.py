import os
import yaml


def read_config(filename):
	root = os.path.dirname(os.path.abspath(__file__))
	fullpath = os.path.join(root, filename)
	with open(fullpath) as cfg:
	    config = yaml.load(cfg, Loader=yaml.Loader)
	return config


dev = read_config("dev.yaml")
prod = read_config("prod.yaml")