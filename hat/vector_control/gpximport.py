from datetime import timezone

import gpxpy

from hat.vector_control.models import GpsImport, Target
from django.contrib.gis.geos import Point


def gpximport(filename, file=None, user=None):
    if file is None:
        file = open(filename, 'r')
    content = file.read()
    if hasattr(content, 'decode'):
        content = content.decode('utf-8')

    gpx = gpxpy.parse(content)
    file.close()

    gps_import = GpsImport.objects.create(
        filename=filename,
        file_date_time=gpx.time.replace(tzinfo=timezone.utc),
        creator=gpx.creator,
        user=user,
        count=len(gpx.waypoints)
    )

    for wp in gpx.waypoints:
        print (wp)
        Target.objects.get_or_create(
            location=Point(x=wp.longitude, y=wp.latitude, z=wp.elevation, srid=4326),
            name=wp.name,
            deployment=None,
            full_name=filename + " " + wp.name,
            gps_import=gps_import,
            date_time=wp.time.replace(tzinfo=timezone.utc),
            river=None,
        )

    return gps_import
