from rest_framework import serializers

from dynamic_fields.serializer import DynamicFieldsModelSerializerMixin
from iaso.api.common import ModelSerializer
from iaso.models import OrgUnitChangeRequest


class ETLOrgUnitChangeRequestListSerializer(DynamicFieldsModelSerializerMixin, ModelSerializer):
    new_location = serializers.CharField(
        allow_null=True, allow_blank=True
    )  # to keep legacy behavior before introduction of djangorestframework-gis
    new_geom = serializers.CharField(
        allow_null=True, allow_blank=True
    )  # to keep legacy behavior before introduction of djangorestframework-gis
    old_location = serializers.CharField(
        allow_null=True, allow_blank=True
    )  # to keep legacy behavior before introduction of djangorestframework-gis
    old_geom = serializers.CharField(
        allow_null=True, allow_blank=True
    )  # to keep legacy behavior before introduction of djangorestframework-gis

    class Meta:
        model = OrgUnitChangeRequest
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.read_only = True
