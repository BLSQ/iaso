from django.db.models import Prefetch
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.permissions import BasePermission
from rest_framework.viewsets import GenericViewSet

from iaso.api.common import Paginator
from iaso.api.instances.instances import HasInstancePermission
from iaso.api.instances.serializers import FileTypeSerializer, InstanceFileSerializer, MobileInstancesSerializer
from iaso.models import (
    Instance,
    InstanceFile,
    InstanceQuerySet,
)


class DenyAll(BasePermission):
    """
    Deny all access.
    """

    def has_permission(self, request, view):
        return False


@extend_schema(tags=["Mobile", "Instances"])
class InstancesMobileViewSet(GenericViewSet, RetrieveModelMixin):
    """Mobile Instances API

    GET /api/mobile/instances/<id>/
    GET /api/mobile/instances/<id>/attachments
    """

    permission_classes = [HasInstancePermission]
    http_method_names = ["get"]
    lookup_field = "uuid"
    lookup_url_kwarg = "uuid"
    serializer_class = MobileInstancesSerializer
    pagination_class = Paginator

    def get_queryset(self):
        request = self.request
        queryset: InstanceQuerySet = Instance.objects
        queryset = queryset.filter_for_user(request.user).filter_on_user_projects(user=request.user)
        queryset = queryset.prefetch_related(
            Prefetch("instancefile_set", queryset=InstanceFile.objects_with_file_extensions.all())
        )
        return queryset

    def get_object(self):
        uuid = self.kwargs.get(self.lookup_field)
        try:
            return self.get_queryset().get(uuid=uuid)
        except Instance.DoesNotExist:
            return get_object_or_404(self.get_queryset(), pk=uuid)

    @action(["GET"], detail=True)
    def attachments(self, request, uuid):
        instance = self.get_object()

        file_type_serializer = FileTypeSerializer(data=request.query_params)
        file_type_serializer.is_valid(raise_exception=True)
        image_only = file_type_serializer.validated_data["image_only"]

        queryset = instance.instancefile_set(manager="objects_with_file_extensions").all()

        if image_only:
            queryset = queryset.filter_image()

        self.paginator.results_key = "attachments"
        self.paginator.page_size = self.paginator.get_page_size(request) or 10
        page = self.paginator.paginate_queryset(queryset, request)
        serializer = InstanceFileSerializer(page, many=True, context=self.get_serializer_context())
        return self.paginator.get_paginated_response(serializer.data)
