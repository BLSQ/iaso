from typing import Any

from rest_framework.relations import PrimaryKeyRelatedField

from iaso.api.common import ModelSerializer
from iaso.models import OrgUnit, OrgUnitType, Planning, PlanningConfig


class PlanningConfigCreateSerializer(ModelSerializer):
    org_unit_types = PrimaryKeyRelatedField(
        queryset=OrgUnitType.objects.none(),
        write_only=True,
        required=False,
        allow_null=True,
        allow_empty=True,
        many=True,
    )
    org_unit_groups = PrimaryKeyRelatedField(
        queryset=OrgUnit.objects.none(), write_only=True, required=False, allow_null=True, allow_empty=True, many=True
    )

    class Meta:
        model = PlanningConfig
        fields = ("id", "level", "planning", "org_unit_types", "org_unit_groups")
        extra_kwargs = {
            "id": {"read_only": True},
            "level": {"required": True, "write_only": True},
            "planning": {"required": True, "write_only": True},
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        user = getattr(self.context.get("request", None), "user", None)
        if user:
            self.fields["org_unit_types"].child_relation.queryset = OrgUnitType.objects.filter_for_user_and_app_id(
                user
            ).only("id")
            self.fields["org_unit_groups"].child_relation.queryset = OrgUnit.objects.filter_for_user(user).only("id")
            self.fields["planning"].queryset = Planning.objects.filter_for_user(user).only("id")
