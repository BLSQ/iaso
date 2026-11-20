from typing import Any

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.relations import PrimaryKeyRelatedField

from iaso.api.common import ModelSerializer
from iaso.models import Group, OrgUnitType, PlanningConfig


class PlanningConfigUpdateSerializer(ModelSerializer):
    org_unit_types = PrimaryKeyRelatedField(
        queryset=OrgUnitType.objects.none(),
        write_only=True,
        required=False,
        allow_null=True,
        allow_empty=True,
        many=True,
    )
    org_unit_groups = PrimaryKeyRelatedField(
        queryset=Group.objects.none(), write_only=True, required=False, allow_null=True, allow_empty=True, many=True
    )

    class Meta:
        model = PlanningConfig
        fields = ("level", "org_unit_types", "org_unit_groups")
        extra_kwargs = {
            "level": {"write_only": True},
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        user = getattr(self.context.get("request", None), "user", None)
        if user:
            self.fields["org_unit_types"].child_relation.queryset = OrgUnitType.objects.filter_for_user_and_app_id(
                user, distinct=True
            ).only("id")
            self.fields["org_unit_groups"].child_relation.queryset = Group.objects.filter_for_user(user).only("id")

    def validate_level(self, level: int) -> int:
        user = getattr(self.context.get("request", None), "user", None)

        if self.instance is None or user is None:
            return level

        if (
            PlanningConfig.objects.filter(
                planning=self.instance.planning,
                level=level,
            )
            .filter_for_user(user)
            .exclude(pk=self.instance.pk)
            .exists()
        ):
            raise serializers.ValidationError(
                _("A planning configuration with this level already exists for this planning.")
            )

        return level
