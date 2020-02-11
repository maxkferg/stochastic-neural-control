# Services

Python Services for Autonomous Robot Control

## Control:
Execute a learned policy. Takes the most recent observation from mobile robot,
computes a response and sends it to the robot.

Example Usage:
```
python main.py auto control --all
```


## Maps:
Generate maps based on 3D building geometry

Example Usage:

```
python main.py maps
```


## Simulate:
Building Simulator
Generate observations for a particular building
Observations are published as fast soon as they are generated (10Hz)
Observations are publised to 'robots.events.observation'

Example Usage:
```
python main.py simulate 5dc3dee819dfb1717a23fad9
python main.py simulate 5dc3dee819dfb1717a23fad9 --verbosity=1 --render
```


## Observe:
Observation Generator
Generate observations for a particular building
Observations are published as fast soon as they are generated (10Hz)
Observations are published to 'robots.events.observation'

Example Usage:
```
python main.py observe 5dc3dee819dfb1717a23fad9
python main.py observe 5dc3dee819dfb1717a23fad9 --verbosity=1
```



## Control:
Action Generator
Generate actions for robots on the stream
Actions are published as soon as they are generated (10Hz)
Actions are published to 'robots.commands.velocity_pred'

Example Usage:
```
export CHECKPOINT=~/ray_results/good/seeker-sac/SAC_MultiRobot-v0_bbbac6db_2019-11-02_23-01-41d2tss5p9/checkpoint_500/checkpoint-500
python main.py control $CHECKPOINT
python main.py control $CHECKPOINT --verbosity=1
```