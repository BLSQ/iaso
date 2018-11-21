from datetime import timezone

import gpxpy

from hat.vector.models import GpsImport, GpsWaypoint, Target


def gpximport(filename, file=None, user=None):
    if file is None:
        file = open(filename, 'r')

    gpx = gpxpy.parse(file)
    file.close()

    gps_import = GpsImport.objects.create(
        filename=filename,
        file_date_time=gpx.time.replace(tzinfo=timezone.utc),
        user=user,
    )

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

    return gps_import


def import_traps_from_gpx(gpx_import):
    for wp in GpsWaypoint.objects.filter(gps_import=gpx_import, ignore=False):
        Target.objects.get_or_create(
            id=gpx_import.filename + " " + wp.name + " " + str(wp.id),
            latitude=wp.latitude,
            longitude=wp.longitude,
            altitude=wp.elevation,
            name=wp.name,
            deployment=None,
            full_name=gpx_import.filename + " " + wp.name,
            gps=gpx_import.filename,
            date_time=wp.date_time,
            river=None,
        )
