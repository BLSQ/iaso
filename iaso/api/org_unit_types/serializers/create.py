from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Form, OrgUnitType, Project


class OrgUnitTypeCreateSerializer(ModelSerializer):
    project_ids = serializers.PrimaryKeyRelatedField(
        source="projects", write_only=True, many=True, queryset=Project.objects.none(), allow_empty=False
    )
    sub_unit_type_ids = serializers.PrimaryKeyRelatedField(
        source="sub_unit_types", write_only=True, many=True, allow_empty=True, queryset=OrgUnitType.objects.all()
    )
    allow_creating_sub_unit_type_ids = serializers.PrimaryKeyRelatedField(
        source="allow_creating_sub_unit_types",
        write_only=True,
        many=True,
        allow_empty=True,
        queryset=OrgUnitType.objects.all(),
    )
    reference_forms_ids = serializers.PrimaryKeyRelatedField(
        source="reference_forms",
        write_only=True,
        required=False,
        many=True,
        allow_empty=True,
        queryset=Form.objects.all(),
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
        user = self.context["request"].user

        if account:
            self.fields["project_ids"].child_relation.queryset = Project.objects.filter(account=account)

            self.fields["sub_unit_type_ids"].child_relation.queryset = OrgUnitType.objects.filter_for_user(user)
            self.fields[
                "allow_creating_sub_unit_type_ids"
            ].child_relation.queryset = OrgUnitType.objects.filter_for_user(user)
            self.fields["reference_forms_ids"].child_relation.queryset = Form.objects.filter_for_user_and_app_id(user)
