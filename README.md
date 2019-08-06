# Digital Points
A real-time geometry server for applications in robotics and building management.

![Digital Points UI](docs/screenshot.png)

## Quick start
```sh
docker build -t digitalpoints/api:latest api
docker build -t digitalpoints/ui:latest ui
docker-compose up
```

## Deploying

Push to dockerhub and patch GKE cluster

```sh
export TAG=12
# UI
docker build -t digitalpoints/ui:production-$TAG ui
docker push digitalpoints/ui:production-$TAG
kubectl set image deployment/ui-deployment ui=digitalpoints/ui:production-$TAG

# API
docker build -t digitalpoints/api:production-$TAG api
docker push digitalpoints/api:production-$TAG
kubectl set image deployment/api-deployment api=digitalpoints/api:production-$TAG
```


## About
The design principles of the DBM-server:
* Persistance: The full object trajectories are persisted for future data analysis
* Speed: The target trajectory update rate is 0.1-1 seconds, allowing real-time decision-making
* Geometry: The system stores all object and environment geomerty
* Visualization: Geomerty is visible through a web application

## License
MIT
