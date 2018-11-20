from datetime import timezone

import gpxpy

from hat.vector.models import GpsImport, GpsWaypoint


def gpximport(filename, file=None):
    if file is None:
        file = open(filename, 'r')

    gpx = gpxpy.parse(file)
    file.close()

    gps_import = GpsImport.objects.create(
        filename=filename,
        file_date_time=gpx.time.replace(tzinfo=timezone.utc))

    for wp in gpx.waypoints:
        GpsWaypoint.objects.create(
            gps_import=gps_import,
            name=wp.name,
            elevation=wp.elevation,
            date_time=wp.time.replace(tzinfo=timezone.utc),
            latitude=wp.latitude,
            longitude=wp.longitude,
            tags=wp.symbol.split(", ") if wp.symbol else None,
        )
