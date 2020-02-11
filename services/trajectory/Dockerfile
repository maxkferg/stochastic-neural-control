FROM python:3.7.4-slim

RUN apt-get update && \
    apt-get -y install gcc mono-mcs && \
    apt-get -y install python3-dev python3-pip libxml2-dev libxslt1-dev zlib1g-dev g++ libspatialindex-dev && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip
RUN pip install pyyaml gym graphqlclient kafka-python numpy
RUN pip install trimesh transforms3d rtree plotly

COPY . .

CMD [ "python", "./main.py", "--headless"]