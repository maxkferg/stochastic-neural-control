FROM maxkferg/pybullet:2.5.7

RUN apt-get update && \
    apt-get -y install gcc mono-mcs && \
    apt-get -y install python3-dev python3-pip libxml2-dev libxslt1-dev zlib1g-dev g++ libspatialindex-dev && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip
RUN pip install pyyaml gym graphqlclient kafka-python numpy scikit-image opencv-python-headless colored_traceback trimesh lxml svg.path
RUN pip install transforms3d plotly shapely rtree networkx pyquaternion astar

# Reinforcement learning dependencies
RUN pip install https://s3-us-west-2.amazonaws.com/ray-wheels/latest/ray-0.8.0.dev6-cp37-cp37m-manylinux1_x86_64.whl
RUN pip install ray[rllib] tensorflow tensorflow-probability psutil

COPY . .

CMD [ "python", "./main.py", "maps"]