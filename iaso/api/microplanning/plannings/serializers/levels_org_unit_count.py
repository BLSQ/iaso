from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.models import Group, OrgUnitType


class LevelOrgUnitCountRequestSerializer(serializers.Serializer):
    level = serializers.IntegerField(required=True, min_value=1, write_only=True)
    org_unit_types = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        allow_null=True,
        allow_empty=True,
        queryset=OrgUnitType.objects.none(),
        required=False,
    )
    org_unit_groups = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, allow_null=True, allow_empty=True, queryset=Group.objects.none(), required=False
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = getattr(self.context.get("request", None), "user", None)
        if user:
            self.fields["org_unit_types"].child_relation.queryset = OrgUnitType.objects.filter_for_user_and_app_id(
                user, distinct=True
            ).only("id")
            self.fields["org_unit_groups"].child_relation.queryset = Group.objects.filter_for_user(user).only("id")


class LevelOrgUnitCountResponseSerializer(serializers.Serializer):
    level = serializers.SerializerMethodField()
    depth = serializers.IntegerField(read_only=True)
    count = serializers.IntegerField(read_only=True)

    @extend_schema_field(serializers.IntegerField)
    def get_level(self, obj: dict) -> int:
        root_level = self.context.get("root_level", 0)
        return obj.get("depth", 0) - root_level
