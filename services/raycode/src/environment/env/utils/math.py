import math
import numpy as np


def normalize_angle(angle):
    """Convert angle to [-pi,pi] range"""
    if angle < -math.pi:
        return normalize_angle(angle + 2*math.pi)
    if angle > math.pi:
        return normalize_angle(angle - 2*math.pi)
    return angle

def positive_component(array):
    """Replace postive values with zero"""
    return (np.abs(array) + array)/2


def find_nearest(array, value):
    array = np.asarray(array)
    idx = (np.abs(array - value)).argmin()
    return array[idx]


def rotation_change(theta1,theta2):
    """Compute the change in rotation, assuming small angle change"""
    dt = theta2 - theta1
    dt1 = dt - 2*math.pi
    dt2 = dt + 2*math.pi
    return find_nearest([dt, dt1, dt2], 0)