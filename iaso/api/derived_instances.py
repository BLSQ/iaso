import typing

from rest_framework import serializers, permissions

from iaso.dhis2.derived_instance_generator import generate_instances  # type: ignore
from iaso.models import ExportRequest, Form, DERIVED
from .common import ModelViewSet, HasPermission
from hat.menupermissions import models as permission


class DerivedInstanceSerializer(serializers.Serializer):
    def validate(self, data: typing.Mapping):
        data = self.context["request"].data
        periods = data["periods"]
        form_ids = list(map(lambda f: f["form_version__form_id"], data["derived"]))

        return {"periods": periods, "form_ids": form_ids}

    def create(self, validated_data):
        forms = Form.objects.filter(pk__in=validated_data["form_ids"])
        profile = self.context["request"].user.iaso_profile
        forms = forms.filter(projects__account=profile.account)
        stats = []

        if forms.count() == 0:
            raise serializers.ValidationError(
                {"form_ids": "no form or allowed : " + (" ".join(list(map(str, validated_data["form_ids"]))))}
            )

        for stat_form in forms:
            for period in validated_data["periods"]:
                cvs_stat_version = stat_form.latest_version
                cvs_stat_mapping_version = cvs_stat_version.mapping_versions.filter(
                    form_version=cvs_stat_version, mapping__mapping_type=DERIVED
                ).last()
                cvs_form = Form.objects.get(form_id=cvs_stat_mapping_version.json["formId"])
                # TODO project ?
                stats.append(generate_instances(cvs_form.projects.first(), cvs_form, cvs_stat_mapping_version, period))
        validated_data["stats"] = stats
        return validated_data

    def to_representation(self, instance):
        # hack to return stats on create
        return instance


class DerivedInstancesViewSet(ModelViewSet):
    f"""Derived instances API

    This API is restricted to authenticated users having the "{permission.COMPLETENESS}" permission

    POST /api/derivedinstances/
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.COMPLETENESS)]  # type: ignore
    serializer_class = DerivedInstanceSerializer
    results_key = "export_instances"
    queryset = ExportRequest.objects.all()
    http_method_names = ["post", "head", "options", "trace"]
