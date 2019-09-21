

def min_distance(polygon, point):
	"""
	Return the minimum distance between a point and a polygon edge
	"""
	dist = polygon.exterior.distance(point)
	for interior in polygon.interiors:
		dist = min(dist, interior.distance(point))
	return dist