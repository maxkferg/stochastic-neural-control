# Building Simulator for Mobile Robot Control

This repository contains:
1) A building simulator for simulating the movement of robots in various building scenarios. [[ui](ui)] [[api server](api)]

2) A web-based editor for creating and viewing navigation scenarios. [[source](ui)]

3) An autonomous mobile robot control algorithm that uses pointcloud data for control. [[Safe Neural Control](services/auto)]

4) Benchmark navigation tasks. [[Gym environments](services/auto/src/environment)]


## Building Scenario Editor

The building scenario editor allows navgation scenarios to be created and edited from the web browser. It also helps when managing the movement of real mobile robots in a building. However, this part of the codebase is not strictly required for simulating robot behavior or training navigation algorithms. For training navigation algorithms see the [SNC](services/auto) service.

![Digital Points UI](https://raw.githubusercontent.com/maxkferg/digital-points/master/docs/screenshot.png)

## Quick start

Start the databases
```sh
source .env
docker-compose up
```

Start the API
```
cd ui
npm i
npm start
```

Start the UI
```
cd ui
npm i
npm start
```


## Building the docker images
```sh
docker build -t digitalpoints/api:latest api
docker build -t digitalpoints/ui:latest ui
docker-compose up
```


## Deployment (GKE)

Google CloudBuild is used to build and deploy the codebase.

Every commit is built and tested using the same CI pipeline. The UI and API components are automatically deployed to production whenever a pull request is merged into `master`. Deployment configuration is stored in /deployment/cloudbuild.


## About
The design principles of the DBM-server:
* Persistance: The full object trajectories are persisted for future data analysis
* Speed: The target trajectory update rate is 0.1-1 seconds, allowing real-time decision-making
* Geometry: The system stores all object and environment geomerty
* Visualization: Geomerty is visible through a web application

## License
MIT
