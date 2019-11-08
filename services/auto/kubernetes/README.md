# Autonomous control

## Simulating a robot

Run simulators for every environment in the database.
Simulators push observations at 50 ms intervals, or directly after an action is received. 
At each step, the robot fetches the most recent action. If there are no more actions, 
the null action is applied. Target locations are randomly selected.

Listens to `robot.commands.velocity`
Publishes to `robot.events.observation`

```
python main.py auto simulate --all
```

## Controlling a robot

Execute a learned policy. Takes the most recent observation from mobile robot,
computes a response and sends it to the robot.

Listens to `robot.events.observation`
Publishes to `robot.events.velocity`

```
python main.py auto control --all
```



