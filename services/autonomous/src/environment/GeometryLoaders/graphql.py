getCurrentGeometry = '''
{
  meshesCurrent(deleted: false) {
    id
    name
    x
    y
    z
    type
    theta
    scale
    width
    height
    geometry {
      filetype
      filename
      directory
    }
    physics {
      simulated
      stationary
    }
  }
}
'''

getTrajectory = '''
query ($id: String!) {
  trajectory(id: $id) {
    id
    isDeleted
    isSafe
    isReady
    startPoint
    endPoint
    points
    frame
  }
}
'''


updateTrajectory = '''
mutation UpdateTrajectory(
  $id: String!
  $points: [[Float]]
  $startPoint: [Float]
  $endPoint: [Float]
  $isDeleted: Boolean
  $isSafe: Boolean
  $isReady: Boolean
) {
    updateTrajectory(
      trajectoryId: $id
      points: $points
      startPoint: $startPoint
      endPoint: $endPoint
      isDeleted: $isDeleted
      isSafe: $isSafe
      isReady: $isReady
    ) {
      isDeleted
      isSafe
      isReady
      startPoint
      endPoint
      points
      frame
    }
  }
'''


getMapGeometry = '''
query GetMapGeometry {
  mapGeometry {
    id
    name
    mesh_id
    is_deleted
    is_traversable
    internal_polygons {
      points
    }
    external_polygons {
      points
    }
    visual_polygons {
      points
    }
    created_at
    updated_at
  }
}
'''