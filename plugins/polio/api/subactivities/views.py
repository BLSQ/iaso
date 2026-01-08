from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import permissions

from iaso.api.common import ModelViewSet
from plugins.polio.api.subactivities.serializers import (
    SubActivityCreateUpdateSerializer,
    SubActivityListDetailSerializer,
)
from plugins.polio.models import SubActivity


class SubActivityViewSet(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "head", "options", "post", "delete", "put"]
    model = SubActivity
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {"round__campaign__obr_name": ["exact"], "round__id": ["exact"]}

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return SubActivityCreateUpdateSerializer
        return SubActivityListDetailSerializer

    def get_queryset(self):
        return SubActivity.objects.filter(round__campaign__account=self.request.user.iaso_profile.account)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.user.iaso_profile.account != obj.round.campaign.account:
            self.permission_denied(request, message="Cannot access campaign")
