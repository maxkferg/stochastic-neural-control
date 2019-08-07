# Digital Points Physics Server

Physics server for predicting robot locations

## Setting up

```
conda activate sim
```

## Docker Support

Building the docker image
```
export TAG=15
docker build -t digitalpoints/physics:production-$TAG .
```

Running the docker image
```
docker run -it digitalpoints/physics:production-$TAG
```

The speed of the turtlebot is configurable:
```
docker run -it \
-e LINEAR_SPEED=100 \
-e LINEAR_SPEED='bar' \digitalpoints/physics:production-$TAG
```

Deploying
```
docker push digitalpoints/physics:production-$TAG
kubectl set image deployment/physics-deployment physics=digitalpoints/physics:production-$TAG
```
