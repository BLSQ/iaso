import typing

from django.core.exceptions import PermissionDenied
from rest_framework import parsers, permissions, serializers, viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from iaso.dhis2.aggregate_exporter import AggregateExporter
from iaso.dhis2.export_request_builder import ExportRequestBuilder
from iaso.models import ExportRequest, Form, MappingVersion, DERIVED

from .auth.authentication import CsrfExemptSessionAuthentication
from .common import ModelViewSet, TimestampField
from .instance_filters import parse_instance_filters
from iaso.dhis2.derived_instance_generator import generate_instances
from django.http.response import HttpResponse


class DerivedInstanceSerializer(serializers.Serializer):
    def validate(self, data: typing.Mapping):
        data = self.context["request"].data
        periods = data["periods"]
        form_ids = list(map(lambda f: f["form_version__form_id"], data["derived"]))

        return {"periods": periods, "form_ids": form_ids}

    def create(self, validated_data):

        forms = Form.objects.filter(pk__in=validated_data["form_ids"])
        if (
            self.context["request"].user
            and not self.context["request"].user.is_anonymous
        ):
            profile = self.context["request"].user.iaso_profile
            forms = forms.filter(projects__account=profile.account)
        else:
            raise PermissionDenied()
        stats = []

        if forms.count() == 0:
            raise serializers.ValidationError(
                {
                    "form_ids": "no form or allowed : "
                    + (" ".join(list(map(str, validated_data["form_ids"]))))
                }
            )

        for stat_form in forms:
            for period in validated_data["periods"]:

                cvs_stat_version = stat_form.latest_version
                cvs_stat_mapping_version = cvs_stat_version.mapping_versions.filter(
                    form_version=cvs_stat_version, mapping__mapping_type=DERIVED
                ).last()
                cvs_form = Form.objects.get(
                    form_id=cvs_stat_mapping_version.json["formId"]
                )
                # TODO project ?
                stats.append(
                    generate_instances(
                        cvs_form.projects.first(),
                        cvs_form,
                        cvs_stat_mapping_version,
                        period,
                    )
                )
        validated_data["stats"] = stats
        return validated_data

    def to_representation(self, instance):
        # hack to return stats on create
        return instance


class DerivedInstancesViewSet(ModelViewSet):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = [permissions.IsAuthenticated]
    permission_required = ["menupermissions.iaso_completeness"]
    serializer_class = DerivedInstanceSerializer
    results_key = "export_instances"
    queryset = ExportRequest.objects.all()
    http_method_names = "post"
