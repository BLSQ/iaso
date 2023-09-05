import logging
import typing
from datetime import timedelta

from django.utils.timezone import now

logger = logging.getLogger(__name__)
from iaso.models import ExportRequest, KILLED, QUEUED
from rest_framework import serializers, permissions

from iaso.dhis2.export_request_builder import ExportRequestBuilder
from .common import ModelViewSet
from .instance_filters import parse_instance_filters
from iaso.dhis2.datavalue_exporter import DataValueExporter  # type: ignore


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
        # FIXME: Temporary fix till we reimplement this in the new task system, timeout old queued requests.
        REQUEST_TIMEOUT_S = 15 * 60  # 15 minutes
        export_requests = ExportRequest.objects.filter(status=QUEUED).filter(
            queued_at__lt=now() - timedelta(seconds=REQUEST_TIMEOUT_S)
        )
        for export_request in export_requests:
            logger.warning(f"Timeouting {export_request}")
            export_request.status = KILLED
            export_request.last_error_message = "Timeout"
            export_request.exportstatus_set.filter(status=QUEUED).update(status="SKIPPED", last_error_message="Timeout")
            export_request.save()

        try:
            user = self.context["request"].user
            force_export = self.context["request"].data.get("forceExport", False)

            logger.debug("ExportRequest to create", user, validated_data)
            selection = dict()
            selection["selected_ids"] = self.context["request"].data.get("selected_ids", None)
            selection["unselected_ids"] = self.context["request"].data.get("unselected_ids", None)
            return ExportRequestBuilder().build_export_request(
                filters=validated_data,
                launcher=user,
                force_export=force_export,
                selection=selection,
            )
        except Exception as e:
            # warn the client will use this as part of the translation key
            raise serializers.ValidationError({"code": type(e).__name__, "message": str(e)})

    def update(self, export_request, validated_data):
        DataValueExporter().export_instances(export_request)
        # this has a highly probable chance to timeout but the export will continue to be processed
        # still return the export request
        return export_request


class ExportRequestsViewSet(ModelViewSet):
    """Export requests API

    This API is restricted to authenticated users

    GET /api/exportrequests/
    GET /api/exportrequests/<id>
    POST /api/exportrequests/
    PUT /api/exportrequests/<id>
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ExportRequestSerializer
    results_key = "export_requests"
    queryset = ExportRequest.objects.all()
    http_method_names = ["get", "post", "put", "head", "options", "trace"]

    def get_queryset(self):
        queryset = ExportRequest.objects.all()
        queryset = queryset.order_by("-id")
        profile = self.request.user.iaso_profile

        return queryset.filter(launcher__iaso_profile__account=profile.account)
