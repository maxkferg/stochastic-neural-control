

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
{
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