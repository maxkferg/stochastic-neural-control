# Navigation Scenarios

This subfolder contains simulation code for 8+ navigation scenarios, all developed to test fundamental challenges in robotics.

The geometry of each environment is based on a lidar scan or building floorplan from buildings on a University campus. Robot movement within the environments is simulated using a rigid body physics simulator. Robots and targets are positioned randomly at the start of each episode, unless otherwise specified.

```
python tests.py
```

## Room
This is a simple environment with two connected rooms. By default, this environment contains two mobile robots. The room environment was designed to be relatively simple for a navigation algorithm to solve. This environment requires the mobile robot navigation system to move the robot to the target location whilst avoiding collisions with walls, stationary objects and other mobile robots. On average, the target can be reached within 25 steps.

![Room Scenario](/docs/scenarios/room-small.png)

## House
This is a more complex environment with nine connected rooms and multiple long corridors. By default, this environment contains four mobile robots and eight stationary objects. On average, the target can be reached within about 50 steps.

## Laboratory
The laboratory environment is a relatively small but crowded indoor environment. By default, this environment contains three mobile robots and two stationary objects. The environment was developed using a lidar scan from a real space. The laboratory environment contains small spaces and narrow corridors, making navigation and collision avoidance difficult.

![Lab Scenario](/docs/scenarios/lab-small.png)

## Facility
This is a very large single-story facility with 16 rooms and long corridors. Rooms are connected to the corridors with doors, all of which are assumed to be open. On average, the target can be reached within about 90 steps.

![Facility Scenario](/docs/scenarios/y2-small.png)

## Stairwell
The stairwell environment uses the same building geometry as the facility environment but concentrates robot movement to a building stairwell. The simulation is terminated immediately if the robot falls down the stairs. The target is randomly placed near the stairwell to increase the difficulty of the navigation task.

![Stairwell Scenario](/docs/scenarios/fall-prevention-scenario.png)


## Cafe
The cafe environment is designed to test the robot navigation in a crowded open space. The cafe geometry is relatively open, but by default the environment contains six mobile robots and 14 randomly placed stationary objects.

![Cafe Scenario](/docs/scenarios/cafe.png)

## Platform
In some scenarios a mobile robot must be able to navigate a space with a high probability of falls. The platform environment is a suspended platform with no walls. By default, three mobile robots are placed on the platform. The simulation is terminated immediately if the robot falls off the platform.

The platform environment is challenging for several reasons. Firstly, the environment does not contains any walls, so algorithms that rely solely on data from the horizontal laser scanner will fail. Secondly, the platform contains long narrow sections with many places that the robot can fall. It follows, that many reward-based planners may suggest that the robot remains stationary.

To solve this environment, the SNC motion planing algorithm is given access to a map describing the layout of the platform. The control algorithm does not have access to the map, but relies on the data from the RGB-D camera to avoid falls.

![Platform Scenario](/docs/scenarios/platform-small.png)

## Bottleneck
The bottleneck environment consists of two rooms separated by a narrow hallway. Each robot is placed in a room with its target location in the other room. Robots navigating with a purely greedy policy will generally fail to solve this task, as there is insufficient space for them to pass in the bottleneck.

The bottleneck environment is challenging for several reasons. Firstly, the mobile robot must plan and execute a trajectory along a narrow corridor. Historically, narrow corridors have proved challenging for many motion planning algorithms. More challenging though, is that the mobile robots are unable to pass each other in the corridor. Hence, the two mobile robots can only solve this environment if one robot waits for the other to travel through the corridor.

![Bottleneck Scenario](/docs/scenarios/bottleneck-small.png)
