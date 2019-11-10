
getCurrentGeometry = '''
query ($building_id: String!) {
  meshesOfBuilding(deleted: false, buildingId: $building_id) {
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