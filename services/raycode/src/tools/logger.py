from datetime import datetime
from packaging import version

import tensorflow as tf
from tensorflow import keras

import numpy as np


logdir = "logs/scalars/" + datetime.now().strftime("%Y%m%d-%H%M%S")
tensorboard_callback = keras.callbacks.TensorBoard(log_dir=logdir)
