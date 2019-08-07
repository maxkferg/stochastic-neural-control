

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