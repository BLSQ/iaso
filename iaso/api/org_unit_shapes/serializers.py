from django.contrib.gis.geos import GEOSGeometry
from rest_framework import serializers

from hat.audit import models as audit_models
from iaso.models import OrgUnit
from iaso.utils.gis import simplify_geom


class OrgUnitShapeSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = [
            "id",
            "name",
            "geom",
            "simplified_geom",
        ]
        read_only_fields = [
            "id",
            "name",
            "simplified_geom",
        ]

    def validate_geom(self, value: str) -> GEOSGeometry:
        try:
            return GEOSGeometry(value, srid=4326)
        except (TypeError, ValueError):
            raise serializers.ValidationError("Invalid geometry.")

    def update(self, instance: OrgUnit, validated_data: dict) -> OrgUnit:
        original_org_unit = audit_models.serialize_instance(instance)

        geom = validated_data["geom"]
        instance.geom = geom
        instance.simplified_geom = simplify_geom(geom)
        instance.save()

        # Log changes.
        audit_models.log_modification(
            original_org_unit, instance, audit_models.ORG_UNIT_API_SHAPE, user=self.context["request"].user
        )

        return instance
