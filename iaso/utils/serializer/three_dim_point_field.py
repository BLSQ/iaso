from rest_framework import serializers

from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis.geos.error import GEOSException
from django.utils.translation import gettext_lazy as _


class ThreeDimPointField(serializers.Field):
    """
    Expected input:
    {
        "latitude": 49.8782482189424,
        "longitude": 24.452545489,
        "altitude": 5.1,
    }
    """

    default_error_messages = {
        "invalid": _("Enter a valid location."),
    }

    def to_internal_value(self, value):
        if not value and not self.required:
            return None
        if value and isinstance(value, dict):
            try:
                latitude = value.get("latitude")
                longitude = value.get("longitude")
                altitude = value.get("altitude")
                return GEOSGeometry(f"POINT({longitude} {latitude} {altitude})", srid=4326)
            except (GEOSException, ValueError):
                self.fail("invalid")
        self.fail("invalid")

    def to_representation(self, value):
        if isinstance(value, GEOSGeometry):
            return {
                "latitude": value.y,
                "longitude": value.x,
                "altitude": value.z,
            }
        return None
