from django.contrib.contenttypes.models import ContentType
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet

from hat.audit.models import Modification
from iaso.api.common import HasPermission
from iaso.api.common.mixin import CustomPaginationListModelMixin
from iaso.api.instance_diff.filters import InstanceDiffFilter
from iaso.api.instance_diff.pagination import InstanceDiffPaginator
from iaso.api.instance_diff.serializers import InstanceModificationSerializer
from iaso.models import Instance, InstanceFile
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION


@extend_schema(tags=["Submission diff"])
class InstanceDiffViewSet(CustomPaginationListModelMixin, GenericViewSet):
    permission_classes = [IsAuthenticated, HasPermission(CORE_SUBMISSIONS_PERMISSION)]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = InstanceDiffFilter
    ordering = ["-created_at"]
    ordering_fields = ["created_at"]
    http_method_names = ["get"]
    pagination_class = InstanceDiffPaginator

    def instance_queryset(self, queryset):
        return queryset.select_related("form_version").prefetch_related(
            Prefetch("instancefile_set", InstanceFile.objects.filter(deleted=False), to_attr="active_files")
        )

    def get_instance(self):
        if not hasattr(self, "_instance"):
            self._instance = get_object_or_404(
                self.instance_queryset(Instance.objects.filter_for_user(self.request.user)),
                pk=self.kwargs["instance_id"],
            )
        return self._instance

    def get_queryset(self):
        instance_content_type = ContentType.objects.get_for_model(Instance)

        # so we trigger a 404 if not found
        instance = self.get_instance()

        return Modification.objects.select_related("content_type").filter(
            content_type=instance_content_type, object_id=str(instance.pk)
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["instance"] = self.get_instance()
        return context

    def get_serializer_class(self):
        if self.action == "list":
            return InstanceModificationSerializer
        raise NotImplementedError(f"Serializer not implemented for {self.action}")
