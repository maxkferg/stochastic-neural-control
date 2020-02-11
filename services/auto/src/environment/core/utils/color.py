import colorsys
from random import random

def random_color():
    h,s,l = random(), 0.5 + random()/2.0, 0.6 + random()/10.0
    r,g,b = colorsys.hls_to_rgb(h,l,s)
    return r, g, b, 0.5