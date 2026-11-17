from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_serializer
from rest_framework import serializers

from iaso.api.microplanning.common.filters import (
    validate_planning_has_org_unit_scope,
    validate_planning_org_unit_type_ids,
)
from iaso.models import Planning, Team


User = get_user_model()


@extend_schema_serializer(
    component_name="BulkAssignmentRequest",
    description="Bulk assign or reassign org units using table selection and planning children scope filters.",
)
class BulkAssignmentSerializer(serializers.Serializer):
    """Assign orgunit in bulk to as team or user.

    update assignment object if it exists otherwise create it
    Audit the modification"""

    planning = serializers.PrimaryKeyRelatedField(
        queryset=Planning.objects.none(),
        write_only=True,
        help_text="Planning the assignments belong to.",
    )
    team = serializers.PrimaryKeyRelatedField(
        queryset=Team.objects.none(),
        write_only=True,
        required=False,
        allow_null=True,
        help_text="Team to assign. Mutually exclusive with `user`.",
    )
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.none(),
        write_only=True,
        required=False,
        allow_null=True,
        help_text="User to assign. Mutually exclusive with `team`.",
    )
    select_all = serializers.BooleanField(
        default=False,
        required=False,
        help_text="When true, all org units matching the scope filters are selected except `unselected_ids`.",
    )
    selected_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        default=list,
        help_text="Org unit IDs to assign when `select_all` is false.",
    )
    unselected_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        default=list,
        help_text="Org unit IDs to exclude when `select_all` is true.",
    )
    org_unit_parent_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Restrict to descendants of this org unit (same as children-paginated `orgUnitParentId`).",
    )
    org_unit_type_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        default=list,
        help_text="Restrict to these org unit types among the planning target types.",
    )
    search = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Case-insensitive filter on org unit name within the resolved scope.",
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return
        account = user.iaso_profile.account
        users_in_account = User.objects.filter(iaso_profile__account=account)

        self.fields["user"].queryset = users_in_account
        self.fields["planning"].queryset = (
            Planning.objects.filter_for_user(user)
            .select_related("org_unit", "selected_sampling_result__group")
            .prefetch_related("target_org_unit_types")
        )
        self.fields["team"].queryset = Team.objects.filter_for_user(user)

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        if validated_data.get("user") and validated_data.get("team"):
            raise serializers.ValidationError(
                {"team": "Cannot specify both user and teams", "user": "Cannot specify both user and teams"}
            )

        select_all = validated_data.get("select_all", False)
        selected_ids = validated_data.get("selected_ids", [])
        unselected_ids = validated_data.get("unselected_ids", [])

        if select_all and selected_ids:
            raise serializers.ValidationError("You cannot set both `select_all` and `selected_ids`.")
        if unselected_ids and not select_all:
            raise serializers.ValidationError("You cannot set `unselected_ids` without `select_all`.")
        if not select_all and not selected_ids:
            raise serializers.ValidationError(
                {"selected_ids": "Must provide selection parameters (select_all or selected_ids)."}
            )

        planning = attrs.get("planning")
        if planning is not None:
            validate_planning_has_org_unit_scope(planning)
            org_unit_type_ids = attrs.get("org_unit_type_ids", [])
            if org_unit_type_ids:
                validate_planning_org_unit_type_ids(planning, org_unit_type_ids)

        return validated_data
