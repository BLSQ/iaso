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


class DerivedInstancesViewSet(ModelViewSet):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = None
    results_key = "export_instances"
    queryset = ExportRequest.objects.all()
    http_method_names = "post"

    def create(self, request):

        periods = request.data["periods"]
        form_ids = list(
            map(lambda f: f["form_version__form_id"], request.data["derived"])
        )
        forms = Form.objects.filter(pk__in=form_ids)
        if self.request.user and not self.request.user.is_anonymous:
            profile = self.request.user.iaso_profile
            forms = forms.filter(projects__account=profile.account)
        else:
            raise PermissionDenied()

        for stat_form in forms:
            for period in periods:

                cvs_stat_version = stat_form.latest_version
                cvs_stat_mapping_version = cvs_stat_version.mapping_versions.filter(
                    form_version=cvs_stat_version, mapping__mapping_type=DERIVED
                ).last()
                cvs_form = Form.objects.get(
                    form_id=cvs_stat_mapping_version.json["formId"]
                )
                # TODO project ?
                generate_instances(
                    cvs_form.projects.first(),
                    cvs_form,
                    cvs_stat_mapping_version,
                    period,
                )

        return Response({"message": "ok"})
