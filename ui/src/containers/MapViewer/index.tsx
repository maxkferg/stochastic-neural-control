//import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Stage, Layer, Group, Line, Circle } from 'react-konva';
import { useQuery } from 'react-apollo-hooks';
import { loader } from 'graphql.macro';
import apollo from '../../apollo';
import Fab from '@material-ui/core/Fab';
import RefreshIcon from '@material-ui/icons/Refresh';
import NavigationIcon from '@material-ui/icons/Navigation';
const HEADER = 64
const MAP_PADDING = 64
const MAP_GEOMETRY_QUERY = loader('../../graphql/getMapGeometry.gql');
const TRAJECTORY_QUERY = loader('../../graphql/getTrajectories.gql');
const GET_ROBOT_QUERY = loader('../../graphql/getRobots.gql');
const CREATE_TRAJECTORY = loader('../../graphql/createTrajectory.gql');
const GET_ROBOT_BUILDING_QUERY = loader('../../graphql/getRobotBuilding.gql');
const MESH_BUILDING_QUERY = loader('../../graphql/getMeshesBuilding.gql');
const useStyles = makeStyles(theme => ({
  navigateButton: {
    position: "absolute",
    top: "100px",
    right: theme.spacing(2),
    margin: theme.spacing(2),
  },
  replanButton: {
    position: "absolute",
    top: "180px",
    right: theme.spacing(2),
    margin: theme.spacing(2),
  },
  extendedIcon: {
    marginRight: theme.spacing(1),
  },
  replanIcon: {
    marginRight: theme.spacing(1),
  },
}));


function getScale(geometry){
  let xmin = Infinity;
  let ymin = Infinity;
  let xmax = -Infinity;
  let ymax = -Infinity;

  for (let ob of geometry){
    for (let polygon of ob.external_polygons){
      let x = polygon.points.map((p) => p[0])
      let y = polygon.points.map((p) => p[1])
      xmin = Math.min(...x, xmin);
      ymin = Math.min(...y, ymin);
      xmax = Math.max(...x, xmax);
      ymax = Math.max(...y, ymax);
    }
  }

  let xscale = (window.innerWidth-2*MAP_PADDING)/(xmax - xmin)
  let yscale = (window.innerHeight-HEADER-2*MAP_PADDING)/(ymax - ymin)

  return {
    xmin: xmin,
    ymin: ymin,
    xmax: xmax,
    ymax: ymax,
    width: xmax - xmin,
    height: ymax - ymin,
    scale: Math.min(xscale, yscale)
  }
}


/**
 * scalePoints
 * Scale points so that that the map is the same size as the screen
 * Center the map geometry in the canvas
 */
function scalePoints(points, scale){
  let xcenter = scale.xmin + scale.width/2
  return points.map(element => ([
    Math.floor((element[0] - xcenter)*scale.scale + window.innerWidth/2),
    Math.floor((element[1] - scale.ymin)*scale.scale + MAP_PADDING)
  ]));
}


/**
 * limitPosition
 * Limit a point to the range [xmin,xmax] and [ymin,ymax]
 * Center the map geometry in the canvas
 */
function limitPosition(point, scale){
  point[0] = Math.max(Math.min(point[0], scale.xmax), scale.xmin)
  point[1] = Math.max(Math.min(point[1], scale.ymax), scale.ymin)
  return point
}


/**
 * inverseScalePoints
 * Scale points from map coordinates to true coordinates
 */
function inverseScalePoints(points, scale){
  let xcenter = scale.xmin + scale.width/2
  return points.map(element => ([
    (element[0] - window.innerWidth/2) / scale.scale + xcenter,
    (element[1] - MAP_PADDING) / scale.scale + scale.ymin
  ]));
}


/**
 * Subscribe to robot position
 * Calls @callback with the position of every robot everytime
 * there is a change
 *
function subscribeRobotPosition(callback){
  GraphqlClient.query({query: GET_ROBOTS}).then(data => {
    // @ts-ignore
    let robotsCurrent = data.data.meshesCurrent;
    callback(robotsCurrent);

    for (let i=0; i<meshesCurrent.length; i++){
      let mesh = meshesCurrent[i]
      SubscriptionClient.subscribe({
        query: SUBSCRIBE_MESH_POSITION,
      }).subscribe({
        next (data) {
          // @ts-ignore
          for (let j=0; j<robotsCurrent.length; j++){
            if (robotsCurrent[j].id==data.data.meshPosition.id){
              robotsCurrent[j].x = data.data.meshPosition.x
              robotsCurrent[j].y = data.data.meshPosition.z
              robotsCurrent[j].z = data.data.meshPosition.z
              robotsCurrent[j].theta = data.data.meshPosition.theta
              callback(robotsCurrent);
            }
          }
        }
      })
    }
  });
}
*/



/**
 * Map Polygon
 * Draw a single polygon object
 *
 */
function MapPolygon(props) {
  let scaled = scalePoints(props.points, props.scale)
  // Create all the scaled lines

  return (
    <Line
      points={scaled.flat()}
      stroke='black'
      strokeWidth={2}
      closed={true}
    />
  )
}


/**
 * Map Robot
 * Draw a single circle for a robot
 *
 */
function Robot(props) {
  let center = [props.robot.x, -props.robot.z]
  let scaled = scalePoints([center], props.scale)
  // Create all the scaled lines

  return (
    <Group>
      <Circle
        x={scaled[0][0]}
        y={scaled[0][1]}
        radius={12}
        stroke="blue"
      />
      <Circle
        x={scaled[0][0]}
        y={scaled[0][1]}
        radius={12}
        fill="blue"
        opacity={0.4}
      />
    </Group>
  )
}


/**
 * StartNavigation
 * Button to start navigation process
 */
function StartNavigation() {
  const classes = useStyles();
  return (
    <Fab variant="extended" aria-label="delete" className={classes.navigateButton}>
      <NavigationIcon className={classes.extendedIcon} />
      Start
    </Fab>
  )
}

/**
 * Replan
 * Button to start replan navigation path
 * Creates a new trajectory with startPoint a the robot and endPoint at the target
 *
 */
function Replan(props) {
  const classes = useStyles();
  return (
    <Fab variant="extended" aria-label="delete" onClick={props.onClick} className={classes.replanButton}>
      <RefreshIcon className={classes.replanIcon} />
      Replan
    </Fab>
  )
}

/**
 * Map Target
 * Draw a single target for a robot
 *
 */
function Target(props) {
  let scaled = scalePoints([props.center], props.scale)

  let handleDragEnd = (e) => {
    let center = [e.evt.offsetX, e.evt.offsetY];
    let position = inverseScalePoints([center], props.scale)[0];
    props.onChange(position);
  }

  return (
    <Group
      draggable
      x={scaled[0][0]}
      y={scaled[0][1]}
      onDragEnd={handleDragEnd} >
      <Circle
        radius={12}
        stroke="green"
      />
      <Circle
        radius={12}
        fill="green"
        opacity={0.4}
      />
      <Circle
        radius={6}
        fill="green"
        opacity={1.0}
      />
    </Group>
  )
}


/**
 * Trajectory
 * Draw a single trajectory
 *
 */
function MapTrajectory(props) {
  const trajectory = props.trajectory;
  const scaled = scalePoints(trajectory.points, props.scale)
  let [line, SetLine] = useState(scaled.flat());

  useEffect(() => {
    SetLine(scaled.flat())
  }, [trajectory.id]);

  let points = scaled.map((p,i) => {
    let key = "point" + p[0] + p[1] + i;
    return (
      <Circle
        key={key}
        x={p[0]}
        y={p[1]}
        draggable
        radius={5}
        fill="red"
        onDragMove={(e) => {
          line[2*i] = e.target.attrs.x;
          line[2*i+1] = e.target.attrs.y;
          SetLine(line)
        }}
      />
    )
  })
  // Create all the scaled lines
  return (
    <Group>
      <Line
        key={"line"}
        points={line}
        stroke='red'
        strokeWidth={2}
        closed={false}
      />
      { points }
    </Group>
  )
}

/**
 * MapViewer
 * Draw a map
 *
 */
function MapViewer(props) {
    const options = {
      pollInterval: 1000,
      variables: { buildingId: props.match.params.buildingId }
    }
    const { data, error, loading } = useQuery(MAP_GEOMETRY_QUERY, options);
    const { data: trajData, error: trajError} = useQuery(TRAJECTORY_QUERY, options);
    // const { data: robotData, error: robotError} = useQuery(GET_ROBOT_QUERY, options);
    
    const { data: robotData, error: robotError} = useQuery(MESH_BUILDING_QUERY, Object.assign({}, options, { variables: { buildingId:  props.match.params.buildingId, type: 'robot' }}))
    let [ targetPosition, setTargetPosition] = useState([2,2]);
    //const classes = useStyles();
    //const theme = useTheme();

    if (loading) {
      return <div>Loading...</div>;
    }
    if (error) {
      return <div>Error! {error.message}</div>;
    }

    if (trajError) {
      return <div>Trajectory Fetch Error! {trajError.message}</div>;
    }

    if (robotError) {
      return <div>Robot Fetch Error! {robotError.message}</div>;
    }

    // Create all the polygons
    const scale = getScale(data.mapGeometry);
    const polygonElements = data.mapGeometry.map((ob, j)=> {
      return ob.external_polygons.map((polygon, i) => {
        let key = ob.name + '-' + j + '-' + i;
        return <MapPolygon key={ key } points={polygon.points} scale={scale} />
      })
    })

    const canvasHeight = window.innerHeight - HEADER
    const canvaseWidth = window.innerWidth - HEADER

    // Create trajectories
    let trajElements
    const trajectories = trajData ? trajData.trajectories : [];
    if (trajectories.length){
      let trajectory = trajectories[trajectories.length-1]
      //defaultTargetPosition = limitPosition(trajectory.endPoint, scale)
      trajElements = [<MapTrajectory key={0} trajectory={trajectory} scale={scale} />]
    } else {
      trajElements = [];
    }

    // Create robots
    const robots = robotData ? robotData.meshesOfBuilding : [];
    const robotElements = robots.map(robot => (
        <Robot key={robot.id} robot={robot} scale={scale} />
    ))

    // Replan button handler
    function onReplan(){
      let robot = robots[0];
      let startPoint = [robot.x, robot.y];
      let endPoint = targetPosition;
      apollo.mutate({
        mutation: CREATE_TRAJECTORY,
        variables: {
          startPoint: startPoint,
          endPoint: endPoint,
        }
      })
    }

    // Target move handler
    function onTargetMove(newPosition){
      setTargetPosition(limitPosition(newPosition, scale));
    }

    return (
      <div>
        <Stage width={canvaseWidth} height={canvasHeight}>
          <Layer>
            <Group>{ polygonElements.flat() }</Group>
            { trajElements }
            { robotElements }
            <Target center={targetPosition} scale={scale} onChange={onTargetMove} />
          </Layer>
        </Stage>
        <StartNavigation />
        <Replan onClick={onReplan} />
      </div>
    );
}


export default withRouter(MapViewer);

