from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Form, OrgUnitType, Project


class OrgUnitTypeCreateSerializer(ModelSerializer):
    project_ids = serializers.PrimaryKeyRelatedField(
        source="projects", write_only=True, many=True, queryset=Project.objects.none(), allow_empty=False
    )
    sub_unit_type_ids = serializers.PrimaryKeyRelatedField(
        source="sub_unit_types", write_only=True, many=True, allow_empty=True, queryset=OrgUnitType.objects.none()
    )
    allow_creating_sub_unit_type_ids = serializers.PrimaryKeyRelatedField(
        source="allow_creating_sub_unit_types",
        write_only=True,
        many=True,
        allow_empty=True,
        queryset=OrgUnitType.objects.none(),
    )
    reference_forms_ids = serializers.PrimaryKeyRelatedField(
        source="reference_forms",
        write_only=True,
        required=False,
        many=True,
        allow_empty=True,
        queryset=Form.objects.none(),
    )

    class Meta:
        model = OrgUnitType
        fields = [
            "id",
            "name",
            "short_name",
            "depth",
            "project_ids",
            "sub_unit_type_ids",
            "allow_creating_sub_unit_type_ids",
            "reference_forms_ids",
        ]

        extra_kwargs = {"id": {"read_only": True}}

    def _get_account(self):
        user = getattr(self.context.get("request", None), "user", None)
        iaso_profile = getattr(user, "iaso_profile", None)
        account = getattr(iaso_profile, "account", None)
        return account

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        account = self._get_account()

        if account:
            self.fields["project_ids"].child_relation.queryset = Project.objects.filter(account=account)

        self.fields["sub_unit_type_ids"].child_relation.queryset = OrgUnitType.objects.all()
        self.fields["allow_creating_sub_unit_type_ids"].child_relation.queryset = OrgUnitType.objects.all()
        self.fields["reference_forms_ids"].child_relation.queryset = Form.objects.all()

    def _validate_reference_forms(self, data):
        reference_forms_ids = [form.pk for form in data.get("reference_forms", [])]
        projects_forms_ids = Form.objects.filter(projects__in=data.get("projects", [])).values_list("id", flat=True)
        forms_not_in_projects_forms = set(reference_forms_ids) - set(projects_forms_ids)
        if forms_not_in_projects_forms:
            raise serializers.ValidationError({"reference_forms_ids": _("Invalid reference forms ids")})
        return data

    def validate(self, data):
        self._validate_reference_forms(data)
        return data
