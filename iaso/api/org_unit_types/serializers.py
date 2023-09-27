import typing

from django.db.models import Q
from rest_framework import serializers

from iaso.models import Form, OrgUnitType, OrgUnit, Project
from ..common import TimestampField, DynamicFieldsModelSerializer
from ..forms import FormSerializer
from ..projects.serializers import ProjectSerializer


def get_parents(type_id):
    parents_ids = []
    if type_id is not None:
        queryset = OrgUnitType.objects.filter(sub_unit_types__id=type_id)
        for parent in queryset.all():
            if parent.id not in parents_ids:
                parents_ids.append(parent.id)
            great_parents = get_parents(parent.id)
            for great_parent_id in great_parents:
                if great_parent_id not in parents_ids:
                    parents_ids.append(great_parent_id)
    return parents_ids


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
class OrgUnitTypeSerializerV1(DynamicFieldsModelSerializer):
    """
    V1 kept for mobile where sub_types is actually `allow_creating_sub_unit_types`

    As requested by the mobile app development team, the `reference_forms` field
    is not exposed on this endpoint.
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
        orgUnits = OrgUnit.objects.filter_for_user_and_app_id(
            self.context["request"].user, self.context["request"].query_params.get("app_id")
        ).filter(Q(validated=True) & Q(org_unit_type__id=obj.id))
        orgunits_count = orgUnits.count()
        return orgunits_count

    def get_sub_unit_types(self, obj: OrgUnitType):
        # Filter sub unit types to show only visible items for the current app id
        unit_types = obj.allow_creating_sub_unit_types.all()
        app_id = self.context["request"].query_params.get("app_id")
        if app_id is not None:
            unit_types = unit_types.filter(projects__app_id=app_id)

        return OrgUnitTypeSerializerV1(
            unit_types,
            fields=["id", "name", "short_name", "depth", "created_at", "updated_at"],
            many=True,
            context=self.context,
        ).data

    def validate(self, data: typing.Mapping):
        parents = get_parents(self.context["request"].data.get("id", None))
        # validate sub org unit type
        sub_types_errors = []
        for sub_type in data.get("sub_unit_types", []):
            if sub_type.id in parents:
                sub_types_errors.append(sub_type.name)
        if len(sub_types_errors) > 0:
            raise serializers.ValidationError({"sub_unit_type_ids": sub_types_errors})
        # validate sub org unit type allowed to be created
        create_sub_types_errors = []
        for sub_type in data.get("allow_creating_sub_unit_types", []):
            if sub_type.id in parents:
                create_sub_types_errors.append(sub_type.name)
        if len(create_sub_types_errors) > 0:
            raise serializers.ValidationError({"allow_creating_sub_unit_type_ids": create_sub_types_errors})
        # validate projects (access check)
        for project in data.get("projects", []):
            if self.context["request"].user.iaso_profile.account != project.account:
                raise serializers.ValidationError({"project_ids": "Invalid project ids"})
        return data


class OrgUnitTypeSerializerV2(DynamicFieldsModelSerializer):
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
        orgUnits = OrgUnit.objects.filter_for_user_and_app_id(
            self.context["request"].user, self.context["request"].query_params.get("app_id")
        ).filter(Q(validated=True) & Q(org_unit_type__id=obj.id))
        orgunits_count = orgUnits.count()
        return orgunits_count

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
            context=self.context,
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
            context=self.context,
        ).data

    def validate(self, data: typing.Mapping):
        parents = get_parents(self.context["request"].data.get("id", None))
        # validate sub org unit type
        sub_types_errors = []
        for sub_type in data.get("sub_unit_types", []):
            if sub_type.id in parents:
                sub_types_errors.append(sub_type.name)
        if len(sub_types_errors) > 0:
            raise serializers.ValidationError({"sub_unit_type_ids": sub_types_errors})
        # validate sub org unit type allowed to be created
        create_sub_types_errors = []
        for sub_type in data.get("allow_creating_sub_unit_types", []):
            if sub_type.id in parents:
                create_sub_types_errors.append(sub_type.name)
        if len(create_sub_types_errors) > 0:
            raise serializers.ValidationError({"allow_creating_sub_unit_type_ids": create_sub_types_errors})
        # validate projects (access check)
        for project in data.get("projects", []):
            if self.context["request"].user.iaso_profile.account != project.account:
                raise serializers.ValidationError({"project_ids": "Invalid project ids"})
        validate_reference_forms(data)
        return data
