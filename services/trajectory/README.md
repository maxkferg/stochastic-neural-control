# Digital Points Trajectory Service

Create trajectories from one point to another using RRT

## Docker Support

Building the docker image
```
export TAG=2
docker build -t digitalpoints/trajectory-service:production-$TAG .
```

Running the docker image
```
docker run -it digitalpoints/trajectory-service:production-$TAG
```

The height of the geometry is configurable:
```
docker run -it digitalpoints/trajectory-service:production-$TAG
```

Deploying
```
docker push digitalpoints/trajectory-service:production-$TAG
kubectl set image deployment/trajectory-service api=digitalpoints/trajectory-service:production-$TAG
```
