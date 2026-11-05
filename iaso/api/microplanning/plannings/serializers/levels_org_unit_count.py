from rest_framework import serializers

from iaso.models import Group, OrgUnitType


class LevelOrgUnitCountRequestSerializer(serializers.ModelSerializer):
    level = serializers.IntegerField(required=True, min_value=1)
    org_unit_types = serializers.PrimaryKeyRelatedField(many=True, write_only=True, allow_null=True, allow_empty=True)
    org_unit_groups = serializers.PrimaryKeyRelatedField(many=True, write_only=True, allow_null=True, allow_empty=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = getattr(self.context.get("request", None), "user", None)
        if user:
            self.fields["org_unit_types"].child_relation.queryset = OrgUnitType.objects.filter_for_user_and_app_id(
                user, distinct=True
            ).only("id")
            self.fields["org_unit_groups"].child_relation.queryset = Group.objects.filter_for_user(user).only("id")


class LevelOrgUnitCountSerializer(serializers.Serializer):
    level = serializers.IntegerField(read_only=True)
    count = serializers.IntegerField(read_only=True)
