//import clsx from 'clsx';
import React from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { useQuery } from 'react-apollo-hooks';
import { loader } from 'graphql.macro';

const HEADER = 64
const MAP_PADDING = 64
const MAP_GEOMETRY_QUERY = loader('../../graphql/getMapGeometry.gql');


/*
const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
}));
*/


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
 * Map Polygon
 * Draw a single polygon object
 *
 */
function MapPolygon(props) {
  let scale = props.scale;
  let xcenter = scale.xmin+scale.width/2
  let scaled = props.points.map(element => ([
    Math.floor((element[0]-xcenter)*scale.scale + window.innerWidth/2),
    Math.floor((element[1]-scale.ymin)*scale.scale + MAP_PADDING) 
  ]));
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
 * Map Geometry
 * Draw a single object
 *
 *
function MapObject(props) {
  return props.external_polygons.map((ob) => {
    <MapPolygon object={ob} scale={props.scale} />
  })
}
*/



export default function MapViewer() {
    const { data, error, loading } = useQuery(MAP_GEOMETRY_QUERY);
    //const classes = useStyles();
    //const theme = useTheme();

    if (loading) {
      return <div>Loading...</div>;
    }
    if (error) {
      return <div>Error! {error.message}</div>;
    }
    
    // Create all the polygons
    console.log("Map Geometry:", data.mapGeometry)
    const scale = getScale(data.mapGeometry);
    debugger
    const polygons = data.mapGeometry.map(ob => {
      return ob.external_polygons.map((polygon) => {
        console.log(polygon.points)
        return <MapPolygon points={polygon.points} scale={scale} />
      })
    })

    const canvasHeight = window.innerHeight - HEADER
    const canvaseWidth = window.innerWidth - HEADER

    return (
      <Stage width={canvaseWidth} height={canvasHeight}>
        <Layer>
          <MapPolygon points={data.mapGeometry[0].external_polygons[0].points} scale={scale} />
          { polygons.flat() }
        </Layer>
      </Stage>
    );
}