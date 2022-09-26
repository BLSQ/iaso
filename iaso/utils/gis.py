from django.contrib.gis.geos import Point


def convert_2d_point_to_3d(point: Point) -> Point:
    """Convert a 2D point to a 3D point

    Return the initial point if it's already 3D
    """
    if point.z is None:
        return Point(x=point.x, y=point.y, z=0, srid=point.srid)

    return point
