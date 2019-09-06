

getTrajectory = '''
{
  trajectory(trajectoryId: id) {
    id
    isDeleted
    isSafe
    isCompleted
    startPoint
    endPoint
    points
    frame
  }
}
'''


updateTrajectory = '''
{
  trajectory(trajectoryId: id) {
    id
    isDeleted
    isSafe
    isCompleted
    startPoint
    endPoint
    points
    frame
  }
}
'''


getMapGeometry = '''
{
  trajectory(trajectoryId: id) {
    id
    isDeleted
    isSafe
    isCompleted
    startPoint
    endPoint
    points
    frame
  }
}
'''