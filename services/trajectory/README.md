# Digital Points Map Rewriting

Writes the 3D geometry to 2D Maps

## Setting up

```
conda activate sim
```

## Docker Support

Building the docker image
```
export TAG=2
docker build -t digitalpoints/map-service:production-$TAG .
```

Running the docker image
```
docker run -it digitalpoints/map_service:production-$TAG
```

The height of the geometry is configurable:
```
docker run -it \
-e FURNITURE_HEIGHT=1000 \
\digitalpoints/map-service:production-$TAG
```

Deploying
```
docker push digitalpoints/map-service:production-$TAG
kubectl set image deployment/map-service api=digitalpoints/map-service:production-$TAG
```
