

getCurrentGeometry = '''
{
  meshesCurrent(deleted: false) {
    id
    building_id
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
    deleted
  }
}
'''



getDeletedGeometry = '''
{
  meshesCurrent(deleted: true) {
    id
    name
    deleted
    building_id
  }
}
'''



getMapGeometry = '''
query GetMapGeometry {
  mapGeometry {
    id
    name
    mesh_id
    building_id
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

updateMapGeometry = '''
mutation CreateMapGeometry(
    $name: String!
    $mesh_id: String!
    $building_id: String!
    $internal_polygons: [MapPolygonInput]!
    $external_polygons: [MapPolygonInput]!
    $visual_polygons: [MapPolygonInput]!
    $is_deleted: Boolean!
    $is_traversable: Boolean!
) {
  createMapGeometry(
    name: $name
    mesh_id: $mesh_id
    building_id: $building_id
    internal_polygons: $internal_polygons
    external_polygons: $external_polygons
    visual_polygons: $visual_polygons
    is_deleted: $is_deleted
    is_traversable: $is_traversable
  ) {
    id,
    mesh_id,
    building_id,
    is_deleted,
    external_polygons {points}
    internal_polygons {points}
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