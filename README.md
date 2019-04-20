# DBM Server
A real-time geometry server for applications in robotics and building management.

# Quick start
docker build -t maxkferg/dbm-ui ui
docker-compose up

## About
The design principles of the DBM-server:
* Persistance: The full object trajectories are persisted for future data analysis
* Speed: The target trajectory update rate is 0.1-1 seconds, allowing real-time decision-making
* Geometry: The system stores all object and environment geomerty
* Visualization: Geomerty is visible through a web application

## License
MIT
