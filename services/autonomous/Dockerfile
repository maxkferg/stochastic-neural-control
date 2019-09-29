FROM tensorflow/tensorflow:1.13.1-py3

RUN apt-get update && apt-get install -y \
    libgtk2.0-dev \
    python3-rtree

RUN pip install --upgrade pip
RUN pip install pybullet
RUN pip install https://s3-us-west-2.amazonaws.com/ray-wheels/latest/ray-0.8.0-dev5-cp35-cp35m-manylinux1_x86_64.whl
RUN pip install pyyaml gym graphqlclient graphql-python kafka-python numpy trimesh transforms3d plotly shapely rtree networkx requests
RUN pip install opencv-python-headless scikit-image colored_traceback psutil setproctitle lz4 dask astar pandas
RUN apt-get install -y rsync

COPY src src
WORKDIR src

CMD [ "ls" ]