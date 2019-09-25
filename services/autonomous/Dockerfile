FROM tensorflow/tensorflow:1.13.1-py3

RUN pip install --upgrade pip
RUN pip install pybullet --user
RUN python --version
RUN pip install -U https://s3-us-west-2.amazonaws.com/ray-wheels/latest/ray-0.8.0.dev4-cp35-cp35m-manylinux1_x86_64.whl
RUN pip install pyyaml gym graphqlclient kafka-python numpy trimesh
RUN pip install transforms3d plotly shapely rtree networkx kafka-python graphql-python lz4 dask
RUN pip install opencv-python-headless scikit-image requests
RUN pip install -U dask


RUN apt-get update && apt-get install -y \
    libgtk2.0-dev

RUN pip install colored_traceback

RUN apt-get -y install python3-rtree


RUN pip install psutil setproctitle

COPY src .

CMD [ "ls" ]