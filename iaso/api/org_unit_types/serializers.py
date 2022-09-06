import typing
from django.db.models import Q
from rest_framework import serializers

from iaso.models import OrgUnitType, OrgUnit, Project, Form
from ..common import TimestampField, DynamicFieldsModelSerializer
from ..projects.serializers import ProjectSerializer
from ..forms import FormSerializer


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
            "projects",
            "project_ids",
            "sub_unit_types",
            "sub_unit_type_ids",
            "created_at",
            "updated_at",
            "units_count",
            "reference_form",
            "reference_form_id",
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
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    units_count = serializers.SerializerMethodField(read_only=True)
    reference_form = serializers.SerializerMethodField(read_only=True)
    reference_form_id = serializers.PrimaryKeyRelatedField(
        source="reference_form",
        write_only=True,
        required=False,
        many=False,
        allow_null=True,
        queryset=Form.objects.all(),
    )

    def get_units_count(self, obj: OrgUnitType):
        orgUnits = OrgUnit.objects.filter_for_user_and_app_id(
            self.context["request"].user, self.context["request"].query_params.get("app_id")
        ).filter(Q(validated=True) & Q(org_unit_type__id=obj.id))
        orgunits_count = orgUnits.count()
        return orgunits_count

    def get_reference_form(self, obj: OrgUnitType):
        form_def = Form.objects.filter_for_user_and_app_id(
            self.context["request"].user, self.context["request"].query_params.get("app_id")
        ).filter(id=obj.reference_form_id)
        return FormSerializer(
            form_def.first(),
            fields=["id", "form_id", "created_at", "updated_at", "projects"],
            many=False,
            context=self.context,
        ).data

    def get_sub_unit_types(self, obj: OrgUnitType):
        unit_types = obj.sub_unit_types.all()
        app_id = self.context["request"].query_params.get("app_id")
        if app_id is not None:
            unit_types = unit_types.filter(projects__app_id=app_id)

        return OrgUnitTypeSerializer(
            unit_types,
            fields=["id", "name", "short_name", "depth", "created_at", "updated_at"],
            many=True,
            context=self.context,
        ).data

    def validate(self, data: typing.Mapping):
        # validate projects (access check)
        for project in data.get("projects", []):
            if self.context["request"].user.iaso_profile.account != project.account:
                raise serializers.ValidationError({"project_ids": "Invalid project ids"})
        # validate if form is linked to the right project
        reference_form = data.get("reference_form", None)
        if reference_form:
            projects_form = Form.objects.filter(id=reference_form.id, projects__in=data.get("projects", []))
            if not projects_form:
                raise serializers.ValidationError({"reference_form_id": "Invalid reference form id"})

        return data
