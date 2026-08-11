from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema_field, extend_schema_serializer
from rest_framework import serializers

from iaso.api.common import DateTimestampField, ModelSerializer, TimestampField
from iaso.api.microplanning.filters import (
    validate_planning_has_org_unit_scope,
    validate_planning_org_unit_type_ids,
)
from iaso.api.teams.serializers import NestedTeamSerializer
from iaso.models import (
    EntityType,
    Form,
    Group,
    Mission,
    MissionEntityType,
    MissionForm,
    MissionOrgUnitType,
    MissionWithForms,
    OrgUnit,
    OrgUnitType,
    Planning,
    Project,
    Task,
)
from iaso.models.microplanning import Assignment, PlanningSamplingResult
from iaso.models.missions import MissionType
from iaso.models.org_unit import OrgUnitQuerySet
from iaso.models.team import Team


class NestedProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "color"]
        ref_name = "MicroplanningNestedProject"


class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]
        ref_name = "MicroplanningNestedUser"


class NestedOrgUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name", "org_unit_type"]


class NestedOrgUnitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name"]


class NestedFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = ["id", "name"]
        ref_name = "MicroplanningNestedForm"


class NestedEntityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityType
        fields = ["id", "name"]
        ref_name = "MicroplanningNestedEntityType"


class MissionFormSerializer(serializers.ModelSerializer):
    form = NestedFormSerializer(read_only=True)

    class Meta:
        model = MissionForm
        fields = ["id", "form", "min_cardinality", "max_cardinality"]
        read_only_fields = ["id"]


class MissionFormWriteSerializer(serializers.Serializer):
    form_id = serializers.PrimaryKeyRelatedField(queryset=Form.objects.all(), source="form")
    min_cardinality = serializers.IntegerField(default=1, min_value=0)
    max_cardinality = serializers.IntegerField(required=False, allow_null=True, min_value=0)

    def validate(self, attrs):
        min_val = attrs.get("min_cardinality", 0)
        max_val = attrs.get("max_cardinality")
        if max_val is not None and min_val > max_val:
            raise serializers.ValidationError({"min_cardinality": "min must be ≤ max"})
        return attrs


class MissionReadSerializer(serializers.ModelSerializer):
    mission_forms = MissionFormSerializer(many=True, read_only=True)
    org_unit_type = NestedOrgUnitTypeSerializer(read_only=True, source="org_unit_type.org_unit_type")
    entity_type = NestedEntityTypeSerializer(read_only=True, source="entity_type.entity_type")
    org_unit_min_cardinality = serializers.IntegerField(read_only=True, source="org_unit_type.min_cardinality")
    org_unit_max_cardinality = serializers.IntegerField(read_only=True, source="org_unit_type.max_cardinality")
    entity_min_cardinality = serializers.IntegerField(read_only=True, source="entity_type.min_cardinality")
    entity_max_cardinality = serializers.IntegerField(read_only=True, source="entity_type.max_cardinality")

    class Meta:
        model = MissionWithForms
        fields = [
            "id",
            "name",
            "description",
            "account",
            "mission_type",
            "mission_forms",
            "org_unit_type",
            "org_unit_min_cardinality",
            "org_unit_max_cardinality",
            "entity_type",
            "entity_min_cardinality",
            "entity_max_cardinality",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class MissionWriteSerializer(serializers.ModelSerializer):
    mission_forms = MissionFormWriteSerializer(many=True, required=False)
    org_unit_type = serializers.PrimaryKeyRelatedField(
        required=False, source="org_unit_type.org_unit_type", queryset=OrgUnitType.objects
    )
    org_unit_min_cardinality = serializers.IntegerField(required=False, source="org_unit_type.min_cardinality")
    org_unit_max_cardinality = serializers.IntegerField(required=False, source="org_unit_type.max_cardinality")
    entity_type = serializers.PrimaryKeyRelatedField(
        required=False, source="entity_type.entity_type", queryset=EntityType.objects
    )
    entity_min_cardinality = serializers.IntegerField(required=False, source="entity_type.min_cardinality")
    entity_max_cardinality = serializers.IntegerField(required=False, source="entity_type.max_cardinality")

    class Meta:
        model = MissionWithForms
        fields = [
            "id",
            "name",
            "description",
            "mission_type",
            "mission_forms",
            "org_unit_type",
            "org_unit_min_cardinality",
            "org_unit_max_cardinality",
            "entity_type",
            "entity_min_cardinality",
            "entity_max_cardinality",
        ]
        read_only_fields = ["id"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context["request"].user
        account = user.iaso_profile.account
        self.fields["org_unit_type"].queryset = OrgUnitType.objects.filter(projects__account=account).distinct()
        self.fields["entity_type"].queryset = EntityType.objects.filter(account=account)

    def _validate_cardinality(self, object, errors, prefix):
        min_val = object["min_cardinality"]
        max_val = object["max_cardinality"]
        if min_val is not None and max_val is not None and min_val > max_val:
            errors[f"{prefix}_min_cardinality"] = "min must be ≤ max"

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        user = self.context["request"].user
        validated_data["account"] = user.iaso_profile.account
        validated_data["created_by"] = user
        errors = {}
        mission_type = validated_data.get("mission_type")

        if mission_type == MissionType.FORM_FILLING:
            if not validated_data.get("mission_forms"):
                errors["mission_forms"] = "At least one form is required for FORM_FILLING missions."

        elif mission_type == MissionType.ORG_UNIT_AND_FORM:
            if not validated_data.get("org_unit_type"):
                errors["org_unit_type"] = "Required for ORG_UNIT_AND_FORM missions."
            else:
                self._validate_cardinality(object=validated_data.get("org_unit_type"), errors=errors, prefix="org_unit")

        elif mission_type == MissionType.ENTITY_AND_FORM:
            if not validated_data.get("entity_type"):
                errors["entity_type"] = "Required for ENTITY_AND_FORM missions."
            else:
                self._validate_cardinality(object=validated_data.get("entity_type"), errors=errors, prefix="entity")

        if errors:
            raise serializers.ValidationError(errors)

        return validated_data

    def _save_mission_forms(self, mission, mission_forms_data):
        mission.mission_forms.all().delete()
        for mf_data in mission_forms_data:
            MissionForm.objects.create(
                mission=mission,
                form=mf_data["form"],
                min_cardinality=mf_data.get("min_cardinality", 1),
                max_cardinality=mf_data.get("max_cardinality"),
            )

    def create(self, validated_data):
        mission_forms_data = validated_data.pop("mission_forms", [])
        org_unit_type = validated_data.pop("org_unit_type", None)
        entity_type = validated_data.pop("entity_type", None)
        mission = super().create(validated_data)
        if org_unit_type:
            mission.org_unit_type = MissionOrgUnitType.objects.create(**org_unit_type)
        if entity_type:
            mission.entity_type = MissionEntityType.objects.create(**entity_type)
        if org_unit_type or entity_type:
            mission.save()
        self._save_mission_forms(mission, mission_forms_data)
        return mission

    def update(self, instance, validated_data):
        mission_forms_data = validated_data.pop("mission_forms", None)
        org_unit_type = validated_data.pop("org_unit_type", None)
        entity_type = validated_data.pop("entity_type", None)
        mission = super().update(instance, validated_data)
        updated = False
        if org_unit_type:
            if instance.org_unit_type:
                instance.org_unit_type = MissionOrgUnitType.objects.update(**org_unit_type)
            else:
                mission.org_unit_type = MissionOrgUnitType.objects.create(**org_unit_type)
                updated = True
        elif instance.org_unit_type:
            instance.org_unit_type.delete()
        if entity_type:
            if instance.entity_type:
                instance.entity_type = MissionOrgUnitType.objects.update(**entity_type)
            else:
                mission.entity_type = MissionEntityType.objects.create(**entity_type)
                updated = True
        elif instance.entity_type:
            instance.entity_type.delete()
        if updated:
            mission.save()
        if mission_forms_data is not None:
            self._save_mission_forms(mission, mission_forms_data)
        return mission


class AuditMissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MissionWithForms
        fields = "__all__"


class NestedMissionSerializer(serializers.ModelSerializer):
    """Lightweight serializer for embedding in PlanningReadSerializer."""

    mission_forms = MissionFormSerializer(many=True, read_only=True)
    org_unit_type = NestedOrgUnitTypeSerializer(read_only=True, source="org_unit_type.org_unit_type")
    org_unit_min_cardinality = serializers.IntegerField(read_only=True, source="org_unit_type.min_cardinality")
    org_unit_max_cardinality = serializers.IntegerField(read_only=True, source="org_unit_type.max_cardinality")
    entity_type = NestedEntityTypeSerializer(read_only=True, source="entity_type.entity_type")
    entity_min_cardinality = serializers.IntegerField(read_only=True, source="entity_type.min_cardinality")
    entity_max_cardinality = serializers.IntegerField(read_only=True, source="entity_type.max_cardinality")

    class Meta:
        model = MissionWithForms
        fields = [
            "id",
            "name",
            "description",
            "mission_type",
            "mission_forms",
            "org_unit_type",
            "org_unit_min_cardinality",
            "org_unit_max_cardinality",
            "entity_type",
            "entity_min_cardinality",
            "entity_max_cardinality",
        ]
        read_only_fields = fields


class NestedPlanningSamplingResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanningSamplingResult
        fields = ["id", "pipeline_id", "pipeline_version", "pipeline_name", "group_id", "task_id"]


class PlanningWriteSerializer(serializers.ModelSerializer):
    selected_sampling_result = serializers.PrimaryKeyRelatedField(
        queryset=PlanningSamplingResult.objects.all(), required=False, allow_null=True
    )
    pipeline_uuids = serializers.ListField(child=serializers.UUIDField(), required=False, allow_empty=True)

    class Meta:
        model = Planning
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "deleted_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context["request"].user
        account = user.iaso_profile.account
        self.fields["project"].queryset = account.project_set.all()
        self.fields["team"].queryset = Team.objects.filter_for_user(user)
        self.fields["org_unit"].queryset = OrgUnit.objects.filter_for_user_and_app_id(user, None)
        self.fields["missions"].child_relation.queryset = Mission.objects.filter_for_user(user)
        self.fields["target_org_unit_types"].child_relation.queryset = OrgUnitType.objects.filter(
            projects__account=account
        ).distinct()

    def validate(self, attrs):
        validated_data = super().validate(attrs)

        user = self.context["request"].user
        validated_data["created_by"] = user
        validation_errors = {}
        if (
            validated_data.get("started_at")
            and validated_data.get("ended_at")
            and validated_data["started_at"] > validated_data["ended_at"]
        ):
            validation_errors["started_at"] = "startDateAfterEndDate"
            validation_errors["ended_at"] = "EndDateBeforeStartDate"

        if validated_data.get("published_at") and validated_data.get("started_at") is None:
            validation_errors["started_at"] = "publishedWithoutStartDate"
        if validated_data.get("published_at") and validated_data.get("ended_at") is None:
            validation_errors["ended_at"] = "publishedWithoutEndDate"

        project = validated_data.get("project", self.instance.project if self.instance else None)

        team = validated_data.get("team", self.instance.team if self.instance else None)
        if team.project != project:
            validation_errors["team"] = "planningAndTeams"

        missions = validated_data.get("missions", list(self.instance.missions.all()) if self.instance else None)
        if missions:
            account = project.account
            for mission in missions:
                if mission.account != account:
                    validation_errors["missions"] = "missionNotInAccount"
                    break

        org_unit = validated_data.get("org_unit", self.instance.org_unit if self.instance else None)
        if org_unit and org_unit.org_unit_type:
            org_unit_projects = org_unit.org_unit_type.projects.all()
            if project not in org_unit_projects:
                validation_errors["org_unit"] = "planningAndOrgUnit"

        target_org_unit_types = validated_data.get(
            "target_org_unit_types",
            list(self.instance.target_org_unit_types.all()) if self.instance else None,
        )
        if target_org_unit_types:
            for target_type in target_org_unit_types:
                target_type_projects = target_type.projects.all()
                if project not in target_type_projects:
                    validation_errors["target_org_unit_types"] = "planningAndTargetOrgUnitType"
                    break
                descendant_org_units = OrgUnit.objects.descendants(org_unit).filter(org_unit_type=target_type)
                if not descendant_org_units.exists():
                    validation_errors["target_org_unit_types"] = "noOrgUnitsOfTypeInHierarchy"
                    break

        selected_sampling_result = validated_data.get("selected_sampling_result")
        if selected_sampling_result:
            if selected_sampling_result and self.instance and selected_sampling_result.planning_id != self.instance.id:
                validation_errors["selected_sampling_result"] = "samplingNotForPlanning"
            validated_data["selected_sampling_result"] = selected_sampling_result

        if validation_errors:
            raise serializers.ValidationError(validation_errors)

        return validated_data


class PlanningReadSerializer(serializers.ModelSerializer):
    assignments_count = serializers.SerializerMethodField()

    class Meta:
        model = Planning
        fields = [
            "id",
            "name",
            "missions",
            "description",
            "published_at",
            "started_at",
            "ended_at",
            "pipeline_uuids",
            "selected_sampling_result",
            "assignments_count",
            "team_details",
            "org_unit_details",
            "project_details",
            "target_org_unit_type_details",
        ]
        read_only_fields = fields

    def get_assignments_count(self, obj):
        return getattr(obj, "assignments_count", 0)

    selected_sampling_result = NestedPlanningSamplingResultSerializer(read_only=True)
    team_details = NestedTeamSerializer(source="team", read_only=True)
    org_unit_details = NestedOrgUnitSerializer(source="org_unit", read_only=True)
    project_details = NestedProjectSerializer(source="project", read_only=True)
    target_org_unit_type_details = NestedOrgUnitTypeSerializer(
        source="target_org_unit_types", many=True, read_only=True
    )


class SamplingGroupSerializer(serializers.ModelSerializer):
    org_unit_count = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ["id", "name", "org_unit_count"]

    def get_org_unit_count(self, group: Group) -> int:
        return len(group.org_units.all())


class SamplingTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["id", "name", "status"]


class PlanningSamplingResultReadSerializer(serializers.ModelSerializer):
    planning = serializers.PrimaryKeyRelatedField(read_only=True)
    group_id = serializers.IntegerField(read_only=True, allow_null=True)
    task_id = serializers.IntegerField(read_only=True, allow_null=True)
    created_at = TimestampField(read_only=True)
    created_by_details = NestedUserSerializer(source="created_by", read_only=True)
    group_details = SamplingGroupSerializer(source="group", read_only=True)
    task_details = SamplingTaskSerializer(source="task", read_only=True)

    class Meta:
        model = PlanningSamplingResult
        fields = [
            "id",
            "planning",
            "task_id",
            "task_details",
            "pipeline_id",
            "pipeline_version",
            "group_id",
            "pipeline_name",
            "group_details",
            "parameters",
            "created_at",
            "created_by",
            "created_by_details",
        ]
        read_only_fields = [
            "id",
            "planning",
            "created_at",
            "created_by",
            "created_by_details",
            "group_details",
            "task_details",
        ]


class PlanningSamplingResultListSerializer(serializers.Serializer):
    planning_id = serializers.PrimaryKeyRelatedField(queryset=Planning.objects.none())

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            self.fields["planning_id"].queryset = Planning.objects.filter_for_user(user)


class PlanningSamplingResultWriteSerializer(serializers.ModelSerializer):
    planning_id = serializers.PrimaryKeyRelatedField(
        queryset=Planning.objects.none(),
        source="planning",
        write_only=True,
    )
    group_id = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.none(),
        allow_null=True,
        required=False,
        source="group",
    )
    task_id = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.none(),
        allow_null=True,
        required=False,
        source="task",
    )

    class Meta:
        model = PlanningSamplingResult
        fields = [
            "planning_id",
            "task_id",
            "pipeline_id",
            "pipeline_version",
            "pipeline_name",
            "group_id",
            "parameters",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            account = user.iaso_profile.account
            self.fields["planning_id"].queryset = Planning.objects.filter(project__account=account)
            self.fields["group_id"].queryset = Group.objects.filter_for_user(user)
            self.fields["task_id"].queryset = Task.objects.filter(account=account)


class AuditPlanningSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planning
        fields = "__all__"


class AssignmentSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return
        account = user.iaso_profile.account
        users_in_account = User.objects.filter(iaso_profile__account=account)

        self.fields["user"].queryset = users_in_account
        self.fields["planning"].queryset = Planning.objects.filter_for_user(user).select_related("org_unit")
        self.fields["team"].queryset = Team.objects.filter_for_user(user)
        self.fields["org_unit"].queryset = OrgUnit.objects.filter_for_user_and_app_id(user, None)

    class Meta:
        model = Assignment
        fields = ["id", "planning", "user", "team", "org_unit", "org_unit_details"]
        read_only_fields = ["created_at"]

    org_unit_details = NestedOrgUnitSerializer(source="org_unit", read_only=True)

    def validate(self, attrs):
        validated_data = super().validate(attrs)

        user = self.context["request"].user
        validated_data["created_by"] = user

        assigned_user = validated_data.get("user", self.instance.user if self.instance else None)
        assigned_team = validated_data.get("team", self.instance.team if self.instance else None)
        if assigned_team and assigned_user:
            raise serializers.ValidationError("Cannot assign on both team and users")

        planning = validated_data.get("planning", self.instance.planning if self.instance else None)
        org_unit: OrgUnit = validated_data.get("org_unit", self.instance.org_unit if self.instance else None)

        org_units_available: OrgUnitQuerySet = self.fields["org_unit"].queryset
        org_units_available = org_units_available.descendants(planning.org_unit)
        if not org_units_available.filter(pk=org_unit.pk).exists():
            raise serializers.ValidationError({"org_unit": "OrgUnit is not in planning scope"})
        # TODO More complex check possible:
        # - Team or user should be under the root planning team
        # - check that the hierarchy of the planning assignement is respected
        # - one of the parent org unit should be assigned to a parent team of the assigned user or team
        # - type  of org unit is valid for this form
        return validated_data


class AuditAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = "__all__"


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


class BulkDeleteAssignmentSerializer(serializers.Serializer):
    """Bulk soft delete all assignments for a specific user and/or planning.

    Marks all assignments linked to the specified planning as deleted using the deleted_at field.
    Audit the modification.
    """

    planning = serializers.PrimaryKeyRelatedField(queryset=Planning.objects.none(), write_only=True)
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.none(), write_only=True, required=False, allow_null=True
    )
    team = serializers.PrimaryKeyRelatedField(
        queryset=Team.objects.none(), write_only=True, required=False, allow_null=True
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return
        self.fields["planning"].queryset = Planning.objects.filter_for_user(user)
        self.fields["user"].queryset = User.objects.select_related("iaso_profile__account").filter(
            iaso_profile__account__id=user.iaso_profile.account.id
        )
        self.fields["team"].queryset = Team.objects.filter_for_user(user)


class BulkDeleteAssignmentResponseSerializer(serializers.Serializer):
    message = serializers.CharField(read_only=True)
    deleted_count = serializers.IntegerField(read_only=True)
    planning_id = serializers.IntegerField(read_only=True)
    user = serializers.IntegerField(allow_null=True, read_only=True)


# noinspection PyMethodMayBeStatic
class MobilePlanningSerializer(serializers.ModelSerializer):
    "Serialize plannings for mobile and transforms missions into forms to stay backward compatible with older versions"

    def save(self):
        # ensure that we can't save from here
        raise NotImplementedError

    created_at = TimestampField()
    started_at = DateTimestampField()
    ended_at = DateTimestampField()

    assignments = serializers.SerializerMethodField()

    class Meta:
        model = Planning
        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "started_at",
            "ended_at",
            "assignments",
        ]

    @staticmethod
    def get_assignments(planning: Planning):
        assignments = []
        # Derive form_ids from missions for backward compatibility
        planning_form_ids = set()
        for mission in planning.missions.all():
            planning_form_ids.update(mission.mission_forms.values_list("form_id", flat=True))

        for a in planning.assignment_set.all():
            out_set = set(a.org_unit.org_unit_type.form_set.values_list("id", flat=True))
            intersection = out_set.intersection(planning_form_ids)
            assignments.append({"org_unit_id": a.org_unit_id, "form_ids": intersection})
        return assignments


class MobilePlanningV2Serializer(serializers.ModelSerializer):
    "Only used to serialize for mobile"

    created_at = TimestampField()
    started_at = DateTimestampField()
    ended_at = DateTimestampField()
    assignments = serializers.SerializerMethodField()

    def save(self):
        # ensure that we can't save from here
        raise NotImplementedError

    class Meta:
        model = Planning
        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "started_at",
            "ended_at",
            "assignments",
        ]

    @staticmethod
    def get_assignments(planning: Planning):
        assignments = []
        for a in planning.assignment_set.all():
            missions = []
            for m in planning.missions.all():
                if m.mission_type == MissionType.FORM_FILLING:
                    # We assign the mission only if there is a match between the OUT's forms and the mission's forms
                    out_set = set(a.org_unit.org_unit_type.form_set.values_list("id", flat=True))
                    intersection = out_set.intersection(m.mission_forms.values_list("form_id", flat=True))
                    if len(intersection) > 0:
                        # Only keep the forms that are in the OUT
                        mc = NestedMissionSerializer(m).data
                        mc["mission_forms"] = list(
                            filter(lambda x: x["form"]["id"] in intersection, mc["mission_forms"])
                        )
                        missions.append(mc)
                elif m.mission_type == MissionType.ORG_UNIT_AND_FORM:
                    # We need to filter on OrgUnit which are parent of the type
                    m_out = m.org_unit_type.org_unit_type.id
                    if (
                        m_out == a.org_unit.org_unit_type.id
                        or m_out in a.org_unit.org_unit_type.sub_unit_types.values_list("id", flat=True)
                    ):
                        missions.append(NestedMissionSerializer(m).data)
                elif m.mission_type == MissionType.ENTITY_AND_FORM:
                    # We always assign entities as there are no enforcement on entities and OrgUnit types.
                    missions.append(NestedMissionSerializer(m).data)
                else:
                    raise NotImplementedError("Unknown mission type")
            if len(missions) > 0:
                assignments.append({"org_unit_id": a.org_unit_id, "missions": missions})
        return assignments


class PlanningOrgUnitSerializer(serializers.ModelSerializer):
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


class PlanningOrgUnitTableAssignmentTeamSerializer(ModelSerializer):
    class Meta:
        model = Team
        fields = ["id", "name", "color"]


class PlanningOrgUnitTableAssignmentUserSerializer(ModelSerializer):
    color = serializers.CharField(source="iaso_profile.color", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "color"]


class PlanningOrgUnitTableAssignmentSerializer(ModelSerializer):
    """Assignment row for planning org unit table: both ``team`` and ``user`` are exposed; ``assignment_type`` indicates which is set."""

    team = PlanningOrgUnitTableAssignmentTeamSerializer(allow_null=True, read_only=True)
    user = PlanningOrgUnitTableAssignmentUserSerializer(allow_null=True, read_only=True)
    assignment_type = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = ("id", "team", "user", "assignment_type")

    @extend_schema_field(serializers.ChoiceField(allow_null=True, choices=["team", "user"], required=False))
    def get_assignment_type(self, obj: Assignment):
        if obj.team_id and obj.team:
            return "team"
        if obj.user_id and obj.user:
            return "user"
        return None


class PlanningOrgUnitTableSerializer(ModelSerializer):
    """Paginated planning org units for tables (minimal columns + assignment for this planning)."""

    org_unit_type = NestedOrgUnitTypeSerializer(read_only=True)
    assignment = serializers.SerializerMethodField()

    class Meta:
        model = OrgUnit
        fields = ["id", "name", "org_unit_type", "assignment"]
        read_only_fields = fields

    @extend_schema_field(PlanningOrgUnitTableAssignmentSerializer)
    def get_assignment(self, org_unit: OrgUnit):
        assignment = self._assignment_for_org_unit(org_unit)
        return PlanningOrgUnitTableAssignmentSerializer(instance=assignment).data

    def _assignment_for_org_unit(self, org_unit: OrgUnit):
        prefetched = getattr(org_unit, "_planning_assignments_prefetched", None)
        if prefetched is not None:
            return prefetched[0] if prefetched else None
        planning = self.context.get("planning")
        if planning is None:
            return None
        return (
            Assignment.objects.filter(planning=planning, org_unit=org_unit, deleted_at__isnull=True)
            .select_related("user__iaso_profile", "team")
            .first()
        )
