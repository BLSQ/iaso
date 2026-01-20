from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.response import Response

from hat.audit.audit_mixin import AuditMixin
from iaso.api.common import HasPermission, ModelViewSet
from plugins.polio.api.rounds.reasons_for_delay.serializers import (
    AuditReasonForDelaySerializer,
    ReasonForDelayForCampaignSerializer,
    ReasonForDelaySerializer,
)
from plugins.polio.models import ReasonForDelay
from plugins.polio.permissions import POLIO_CONFIG_PERMISSION, POLIO_PERMISSION


class ReasonForDelayViewSet(AuditMixin, ModelViewSet):
    http_method_names = ["get", "post", "patch"]
    permission_classes = [HasPermission(POLIO_CONFIG_PERMISSION)]
    serializer_class = ReasonForDelaySerializer
    ordering_fields = ["updated_at", "created_at", "name_en", "name_fr", "key_name", "id"]
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
    ]

    audit_serializer = AuditReasonForDelaySerializer

    # TODO annotate to be able to sort on time_selected
    def get_queryset(self):
        account = self.request.user.iaso_profile.account
        return ReasonForDelay.objects.filter(deleted_at__isnull=True).filter(account=account)

    # This endpoint is to populate the dropdown choices for regular polio users
    @action(
        methods=["GET"],
        detail=False,
        permission_classes=[HasPermission(POLIO_PERMISSION, POLIO_CONFIG_PERMISSION)],
    )  # type: ignore
    def forcampaign(self, request):
        queryset = self.get_queryset()
        reasons_for_delay = ReasonForDelayForCampaignSerializer(queryset, many=True).data
        response = Response({"results": reasons_for_delay})
        return response
