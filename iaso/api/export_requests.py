import typing
from django.core.exceptions import PermissionDenied
from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import ExportRequest
from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework import serializers, permissions, parsers
from rest_framework.authentication import BasicAuthentication
from django.core.paginator import Paginator

from iaso.dhis2.export_request_builder import ExportRequestBuilder
from .common import ModelViewSet, TimestampField
from .instance_filters import parse_instance_filters
from iaso.dhis2.aggregate_exporter import AggregateExporter


class ExportRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExportRequest
        fields = ["id", "finished", "status", "last_error_message", "params", "stats"]
        read_only_fields = fields

    stats = serializers.SerializerMethodField()

    @staticmethod
    def get_stats(obj: ExportRequest):
        return {
            "instance_count": obj.instance_count,
            "exported_count": obj.exported_count,
            "errored_count": obj.errored_count,
        }

    def validate(self, data: typing.MutableMapping):

        return parse_instance_filters(self.context["request"].data)

    def create(self, validated_data: typing.MutableMapping):
        try:
            user = self.context["request"].user
            print("ExportRequest to create", user, validated_data)

            return ExportRequestBuilder().build_export_request(
                filters=validated_data, launcher=user
            )
        except Exception as e:
            raise serializers.ValidationError(
                {"code": type(e).__name__, "message": str(e)}
            )

    def update(self, export_request, validated_data):
        AggregateExporter().export_instances(export_request, True)
        # this has a highly probable chance to timeout but the export will continue to be processed
        # still return the export request
        return export_request


class ExportRequestsViewSet(ModelViewSet):
    """
    list export_requests:
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ExportRequestSerializer
    results_key = "export_requests"
    queryset = ExportRequest.objects.all()
    http_method_names = ("get", "post", "put")

    def get_queryset(self):
        queryset = ExportRequest.objects.all()
        queryset = queryset.order_by("-id")

        if self.request.user and not self.request.user.is_anonymous:
            profile = self.request.user.iaso_profile
            queryset = queryset.filter(launcher__iaso_profile__account=profile.account)
        else:
            raise PermissionDenied()

        return queryset
