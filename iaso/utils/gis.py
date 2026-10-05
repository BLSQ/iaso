from django.contrib.gis.geos import MultiPolygon, Point, Polygon


#: `simplify_geom()`'s tolerance, as a share of the shape's largest extent: how far `simplified_geom` can stray
#: from `geom` (the vector tiles rely on it to tell when `simplified_geom` is accurate enough)
SIMPLIFY_TOLERANCE_RATIO = 0.001


def convert_2d_point_to_3d(point: Point) -> Point:
    """Convert a 2D point to a 3D point

    Return the initial point if it's already 3D
    """
    if point.z is None:
        return Point(x=point.x, y=point.y, z=0, srid=point.srid)

    return point


def simplify_geom(geom: MultiPolygon) -> MultiPolygon:
    """
    Simplify a multipolygon geometry using `ST_Simplify`.

    `ST_Simplify` has a `tolerance` parameter which:
    - represents the tolerance level of the Ramer-Douglas-Peucker algorithm
    - seems to be expressed in degrees
    But who does really know how tolerance works and is able to use it in a predictable way?

    Here, we calculate the size of the bounding box and then a proportional tolerance.
    This has better results than a hardcoded tolerance of e.g. 0.002 (especially for large or small shapes).
    """
    (xmin, ymin, xmax, ymax) = geom.extent
    height = abs(xmin - xmax)
    width = abs(ymin - ymax)
    _max = max(height, width)
    tolerance = round(SIMPLIFY_TOLERANCE_RATIO * _max, 10)
    simplified_geom = geom.simplify(tolerance=tolerance)

    if type(simplified_geom) == Polygon:
        simplified_geom = MultiPolygon(simplified_geom)

    return simplified_geom
