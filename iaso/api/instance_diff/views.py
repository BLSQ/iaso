from django.contrib.contenttypes.models import ContentType
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.exceptions import NotFound
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet

from hat.audit.models import Modification
from iaso.api.common import HasPermission
from iaso.api.common.mixin import CustomPaginationListModelMixin
from iaso.api.instance_diff.filters import InstanceDiffFilter
from iaso.api.instance_diff.pagination import InstanceDiffPaginator
from iaso.api.instance_diff.serializers import ModificationSerializer
from iaso.models import Instance
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION


class InstanceDiffViewSet(CustomPaginationListModelMixin, GenericViewSet):
    permission_classes = [IsAuthenticated, HasPermission(CORE_SUBMISSIONS_PERMISSION)]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = InstanceDiffFilter
    ordering = ["-created_at"]
    ordering_fields = ["created_at"]
    http_method_names = ["get"]
    pagination_class = InstanceDiffPaginator

    def get_queryset(self):
        if not Instance.objects.filter_for_user(self.request.user).filter(id=self.kwargs["instance_id"]).exists():
            raise NotFound
        return Modification.objects.filter(
            content_type=ContentType.objects.get_for_model(Instance), object_id=self.kwargs.get("instance_id")
        )

    def get_serializer_class(self):
        if self.action == "list":
            return ModificationSerializer
        raise NotImplementedError(f"Serializer not implemented for {self.action}")
