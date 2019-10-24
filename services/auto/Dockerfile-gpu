FROM pytorch/pytorch:1.3-cuda10.1-cudnn7-runtime

RUN apt-get update && apt-get install -y \
    libgtk2.0-dev \
    python3-rtree \
    vim

RUN pip install --upgrade pip
RUN pip install pybullet
RUN pip install git+https://github.com/astooke/rlpyt
RUN pip install pyyaml gym graphqlclient graphql-python kafka-python numpy trimesh transforms3d plotly shapely rtree networkx requests
RUN pip install opencv-python-headless scikit-image colored_traceback psutil setproctitle lz4 dask astar
RUN apt-get install -y rsync

COPY src src
WORKDIR src

CMD [ "ls" ]