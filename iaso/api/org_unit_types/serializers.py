import typing

from django.db.models import Q
from rest_framework import serializers

from dynamic_fields.serializer import DynamicFieldsModelSerializerBackwardCompatible
from iaso.models import Form, OrgUnit, OrgUnitType, Project

from ..common import TimestampField
from ..forms.serializers import FormSerializer
from ..projects.serializers import ProjectSerializer


def has_cycle_after_adding(node_id, proposed_children, relation_name):
    """
    Returns True if adding proposed_children to node_id's relation_name
    creates a cycle/loop.
    """
    if not node_id:
        return False

    proposed_children_ids = [c.id for c in proposed_children]
    if node_id in proposed_children_ids:
        return True

    visited = set(proposed_children_ids)
    queue = list(proposed_children_ids)

    while queue:
        curr_id = queue.pop(0)
        if curr_id == node_id:
            return True
        try:
            curr_node = OrgUnitType.objects.get(pk=curr_id)
            children_field = getattr(curr_node, relation_name)
            for child_id in children_field.values_list("id", flat=True):
                if child_id not in visited:
                    visited.add(child_id)
                    queue.append(child_id)
        except OrgUnitType.DoesNotExist:
            continue

    return False


def validate_reference_forms(data):
    """
    Validate that reference forms are linked to the right project.
    """
    reference_forms_ids = [form.pk for form in data.get("reference_forms", [])]
    projects_forms_ids = Form.objects.filter(projects__in=data.get("projects", [])).values_list("id", flat=True)
    forms_not_in_projects_forms = set(reference_forms_ids) - set(projects_forms_ids)
    if forms_not_in_projects_forms:
        raise serializers.ValidationError({"reference_forms_ids": "Invalid reference forms ids"})
    return data


# Kept for the mobile
class OrgUnitTypeSerializerV1(DynamicFieldsModelSerializerBackwardCompatible):
    """
    V1 kept for mobile where sub_types is actually `allow_creating_sub_unit_types`

    As requested by the mobile app development team, the `reference_forms` field
    is not exposed here but on `FormSerializer`.
    """

    class Meta:
        model = OrgUnitType
        fields = [
            "id",
            "name",
            "short_name",
            "depth",
            "projects",
            "project_ids",
            "sub_unit_types",
            "sub_unit_type_ids",
            "created_at",
            "updated_at",
            "units_count",
        ]
        read_only_fields = ["id", "projects", "sub_unit_types", "created_at", "updated_at", "units_count"]

    projects = ProjectSerializer(many=True, read_only=True)
    project_ids = serializers.PrimaryKeyRelatedField(
        source="projects", write_only=True, many=True, queryset=Project.objects.all(), allow_empty=False
    )
    sub_unit_types = serializers.SerializerMethodField(read_only=True)
    sub_unit_type_ids = serializers.PrimaryKeyRelatedField(
        source="allow_creating_sub_unit_types",
        write_only=True,
        many=True,
        allow_empty=True,
        queryset=OrgUnitType.objects.all(),
    )
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    units_count = serializers.SerializerMethodField(read_only=True)

    # Fixme make this directly in db !
    def get_units_count(self, obj: OrgUnitType):
        # Show count if it's a detail view OR if with_units_count parameter is present
        if self.context.get("view_action") == "retrieve" or self.context["request"].query_params.get(
            "with_units_count"
        ):
            orgUnits = OrgUnit.objects.filter_for_user_and_app_id(
                self.context["request"].user, self.context["request"].query_params.get("app_id")
            ).filter(Q(org_unit_type__id=obj.id))
            return orgUnits.count()
        return None

    def get_sub_unit_types(self, obj: OrgUnitType):
        # Filter sub unit types to show only visible items for the current app id
        if hasattr(obj, "filtered_allow_creating_sub_unit_types"):
            unit_types = obj.filtered_allow_creating_sub_unit_types
        else:
            unit_types = obj.allow_creating_sub_unit_types.all()
            app_id = self.context["request"].query_params.get("app_id")
            if app_id is not None:
                unit_types = unit_types.filter(projects__app_id=app_id)

        return OrgUnitTypeSerializerV1(
            unit_types,
            fields=["id", "name", "short_name", "depth", "created_at", "updated_at"],
            many=True,
            context={**self.context, "ignore_dynamic_fields": True},
        ).data

    def validate(self, data: typing.Mapping):
        org_unit_type_id = self.instance.id if self.instance else self.context["request"].data.get("id")
        # validate sub org unit type
        if "sub_unit_types" in data:
            if has_cycle_after_adding(org_unit_type_id, data["sub_unit_types"], "sub_unit_types"):
                raise serializers.ValidationError(
                    {"sub_unit_type_ids": ["A loop was detected in the sub-unit types hierarchy."]}
                )
        # validate sub org unit type allowed to be created
        if "allow_creating_sub_unit_types" in data:
            if has_cycle_after_adding(
                org_unit_type_id, data["allow_creating_sub_unit_types"], "allow_creating_sub_unit_types"
            ):
                raise serializers.ValidationError(
                    {
                        "allow_creating_sub_unit_type_ids": [
                            "A loop was detected in the allowed sub-unit types creation hierarchy."
                        ]
                    }
                )
        # validate projects (access check)
        for project in data.get("projects", []):
            if self.context["request"].user.iaso_profile.account != project.account:
                raise serializers.ValidationError({"project_ids": "Invalid project ids"})
        return data

    def to_representation(self, instance):
        # Remove units_count from fields if not requested
        if not self.context["request"].query_params.get("with_units_count"):
            self.fields.pop("units_count", None)
        return super().to_representation(instance)


class OrgUnitTypeSerializerV2(DynamicFieldsModelSerializerBackwardCompatible):
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
            "projects",
            "project_ids",
            "sub_unit_types",
            "sub_unit_type_ids",
            "allow_creating_sub_unit_types",
            "allow_creating_sub_unit_type_ids",
            "created_at",
            "updated_at",
            "units_count",
            "reference_forms",
            "reference_forms_ids",
        ]
        read_only_fields = ["id", "projects", "sub_unit_types", "created_at", "updated_at", "units_count"]

    projects = ProjectSerializer(many=True, read_only=True)
    project_ids = serializers.PrimaryKeyRelatedField(
        source="projects", write_only=True, many=True, queryset=Project.objects.all(), allow_empty=False
    )
    sub_unit_types = serializers.SerializerMethodField(read_only=True)
    sub_unit_type_ids = serializers.PrimaryKeyRelatedField(
        source="sub_unit_types", write_only=True, many=True, allow_empty=True, queryset=OrgUnitType.objects.all()
    )
    allow_creating_sub_unit_types = serializers.SerializerMethodField(read_only=True)
    allow_creating_sub_unit_type_ids = serializers.PrimaryKeyRelatedField(
        source="allow_creating_sub_unit_types",
        write_only=True,
        many=True,
        allow_empty=True,
        queryset=OrgUnitType.objects.all(),
    )
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    units_count = serializers.SerializerMethodField(read_only=True)
    reference_forms = serializers.SerializerMethodField(read_only=True)
    reference_forms_ids: serializers.PrimaryKeyRelatedField = serializers.PrimaryKeyRelatedField(
        source="reference_forms",
        write_only=True,
        required=False,
        many=True,
        allow_empty=True,
        queryset=Form.objects.all(),
    )

    # Fixme make this directly in db !
    def get_units_count(self, obj: OrgUnitType):
        # Show count if it's a detail view OR if with_units_count parameter is present
        if self.context.get("view_action") == "retrieve" or self.context["request"].query_params.get(
            "with_units_count"
        ):
            orgUnits = OrgUnit.objects.filter_for_user_and_app_id(
                self.context["request"].user, self.context["request"].query_params.get("app_id")
            ).filter(Q(org_unit_type__id=obj.id))
            return orgUnits.count()
        return None

    def get_reference_forms(self, obj: OrgUnitType):
        return FormSerializer(
            obj.reference_forms.all(),
            fields=["id", "form_id", "created_at", "updated_at", "projects"],
            many=True,
            context=self.context,
        ).data

    def get_sub_unit_types(self, obj: OrgUnitType):
        # Filter sub unit types to show only visible items for the current app id
        unit_types = obj.sub_unit_types.all()
        app_id = self.context["request"].query_params.get("app_id")
        if app_id is not None:
            unit_types = unit_types.filter(projects__app_id=app_id)

        return OrgUnitTypeSerializerV2(
            unit_types,
            fields=["id", "name", "short_name", "depth", "created_at", "updated_at"],
            many=True,
            context={**self.context, "ignore_dynamic_fields": True},
        ).data

    def get_allow_creating_sub_unit_types(self, obj: OrgUnitType):
        # Filter sub unit types to show only visible items for the current app id
        unit_types = obj.allow_creating_sub_unit_types.all()
        app_id = self.context["request"].query_params.get("app_id")
        if app_id is not None:
            unit_types = unit_types.filter(projects__app_id=app_id)

        return OrgUnitTypeSerializerV2(
            unit_types,
            fields=["id", "name", "short_name", "depth", "created_at", "updated_at"],
            many=True,
            context={**self.context, "ignore_dynamic_fields": True},
        ).data

    def validate(self, data: typing.Mapping):
        org_unit_type_id = self.instance.id if self.instance else self.context["request"].data.get("id")
        # validate sub org unit type
        if "sub_unit_types" in data:
            if has_cycle_after_adding(org_unit_type_id, data["sub_unit_types"], "sub_unit_types"):
                raise serializers.ValidationError(
                    {"sub_unit_type_ids": ["A loop was detected in the sub-unit types hierarchy."]}
                )
        # validate sub org unit type allowed to be created
        if "allow_creating_sub_unit_types" in data:
            if has_cycle_after_adding(
                org_unit_type_id, data["allow_creating_sub_unit_types"], "allow_creating_sub_unit_types"
            ):
                raise serializers.ValidationError(
                    {
                        "allow_creating_sub_unit_type_ids": [
                            "A loop was detected in the allowed sub-unit types creation hierarchy."
                        ]
                    }
                )
        # validate projects (access check)
        for project in data.get("projects", []):
            if self.context["request"].user.iaso_profile.account != project.account:
                raise serializers.ValidationError({"project_ids": "Invalid project ids"})
        validate_reference_forms(data)
        return data

    def to_representation(self, instance):
        # Remove units_count from fields if not requested
        if not self.context.get("view_action") == "retrieve" and not self.context["request"].query_params.get(
            "with_units_count"
        ):
            self.fields.pop("units_count", None)
        return super().to_representation(instance)


class OrgUnitTypeHierarchySerializer(serializers.ModelSerializer):
    """Lightweight serializer for org unit type hierarchy with recursive sub_unit_types"""

    sub_unit_types = serializers.SerializerMethodField()

    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "short_name", "depth", "category", "sub_unit_types"]
        read_only_fields = ["id", "name", "short_name", "depth", "category", "sub_unit_types"]

    def get_sub_unit_types(self, obj):
        """Recursively serialize sub_unit_types to build complete hierarchy"""
        visited = self.context.setdefault("visited_org_unit_types", set())
        if obj.id in visited:
            return []

        child_visited = set(visited)
        child_visited.add(obj.id)
        child_context = {**self.context, "visited_org_unit_types": child_visited}

        sub_types = obj.sub_unit_types.all()
        sub_types = [t for t in sub_types if t.id not in child_visited]
        return OrgUnitTypeHierarchySerializer(sub_types, many=True, context=child_context).data


class OrgUnitTypesDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "depth", "sub_unit_types"]
        read_only_fields = ["id", "name", "depth", "sub_unit_types"]
