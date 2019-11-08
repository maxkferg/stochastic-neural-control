FROM python:3.7.4-slim

RUN apt-get update && \
    apt-get -y install gcc mono-mcs && \
    apt-get -y install python3-dev python3-pip libxml2-dev libxslt1-dev zlib1g-dev g++ libspatialindex-dev && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip
RUN pip install trimesh==2.38.42 lxml svg.path
RUN pip install pyyaml gym graphqlclient kafka-python numpy
RUN pip install transforms3d plotly shapely rtree networkx pyquaternion

COPY . .

CMD [ "python", "./main.py", "--headless"]