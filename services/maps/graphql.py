

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



getDeletedGeometry = '''
{
  meshesCurrent(deleted: true) {
    id
    name
    deleted
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

deleteMapGeometry = '''
mutation CreateMapGeometry {
  createMapGeometry(
    $name: String!,
    $mesh_id: String!
    $building_id: String!
    $internal_polygons: Array!
    $external_polygons: Array!
    $visual_polygons: Array!
    $is_deleted: Bool!
    $is_traversable: Bool!
  ) {
    id,
    mesh_id,
    building_id,
    is_deleted,
    external_polygons {points}
    internal_polygons {points}
    visual_polygons {points}
  }
}
'''

deleteMapGeometry = '''
mutation DeleteMapGeometry($id: String!) {
  mapGeometry(id: $id, is_deleted: true) {
    id,
    mesh_id
    is_deleted,
  }
}
'''