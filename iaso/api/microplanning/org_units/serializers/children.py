from __future__ import annotations

from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import OrgUnit


class PlanningOrgUnitSerializer(ModelSerializer):
    geo_json = serializers.SerializerMethodField()
    has_geo_json = serializers.SerializerMethodField()
    latitude = serializers.FloatField(source="location.y", read_only=True)
    longitude = serializers.FloatField(source="location.x", read_only=True)

    class Meta:
        model = OrgUnit
        fields = ["id", "name", "geo_json", "has_geo_json", "latitude", "longitude", "org_unit_type_id"]
        read_only_fields = ["id", "name", "geo_json", "has_geo_json", "latitude", "longitude", "org_unit_type_id"]

    def get_geo_json(self, org_unit: OrgUnit):
        if not self.get_has_geo_json(org_unit):
            return None

        # Fakes the format of geojson_queryset() so that data can be passed to leaflet
        return {
            "type": "FeatureCollection",
            "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
            "features": [
                {
                    "type": "Feature",
                    "id": org_unit.id,
                    "geometry": org_unit.geo_json,
                }
            ],
        }

    def get_has_geo_json(self, org_unit: OrgUnit) -> bool:
        return hasattr(org_unit, "geo_json") and org_unit.geo_json is not None
