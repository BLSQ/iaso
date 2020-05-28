from rest_framework import serializers

from ..common import TimestampField, DynamicFieldsModelSerializer
from iaso.models import OrgUnitType


class OrgUnitTypeSerializer(DynamicFieldsModelSerializer):
    """This one is a bit cryptic: sub_unit_types is only needed for "root" org unit types
    (the ones returned by the viewset queryset), and they need to be filtered by app_id,
    hence the SerializerMethodField()"""

    class Meta:
        model = OrgUnitType
        fields = [
            "id",
            "name",
            "short_name",
            "depth",
            "sub_unit_types",
            "sub_unit_type_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    sub_unit_types = serializers.SerializerMethodField()
    sub_unit_type_ids = serializers.PrimaryKeyRelatedField(
        source="sub_unit_types",
        write_only=True,
        many=True,
        allow_empty=True,
        queryset=OrgUnitType.objects.all(),
    )
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def get_sub_unit_types(self, obj: OrgUnitType):
        unit_types = obj.sub_unit_types.all()
        app_id = self.context["request"].query_params.get("app_id")
        if app_id is not None:
            unit_types = unit_types.filter(projects__app_id=app_id)

        return OrgUnitTypeSerializer(
            unit_types,
            fields=["id", "name", "short_name", "depth", "created_at", "updated_at",],
            many=True,
            context=self.context,
        ).data
