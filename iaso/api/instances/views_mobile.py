from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import BasePermission

from iaso.api.common import ModelViewSet
from iaso.api.instances.instances import HasInstancePermission, InstanceFileSerializer
from iaso.api.instances.serializers import ImageOnlySerializer
from iaso.models import (
    Instance,
    InstanceQuerySet,
)


class DenyAll(BasePermission):
    """
    Deny all access.
    """

    def has_permission(self, request, view):
        return False


class InstancesMobileViewSet(ModelViewSet):
    """Mobile Instances API

    GET /api/mobile/instances/<id>/attachments
    """

    permission_classes = [DenyAll]
    http_method_names = ["get"]
    lookup_field = "uuid"

    def get_queryset(self):
        request = self.request
        queryset: InstanceQuerySet = Instance.objects
        queryset = queryset.filter_for_user(request.user).filter_on_user_projects(user=request.user)
        return queryset

    @action(["GET"], detail=True, permission_classes=[HasInstancePermission])
    def attachments(self, request, uuid):
        try:
            instance = self.get_queryset().get(uuid=uuid)
        except Instance.DoesNotExist:
            instance = get_object_or_404(self.get_queryset(), pk=uuid)

        image_only_serializer = ImageOnlySerializer(data=request.query_params)
        image_only_serializer.is_valid(raise_exception=True)
        image_only = image_only_serializer.validated_data["image_only"]

        queryset = instance.instancefile_set(manager="objects_with_file_extensions").filter_image_only(
            image_only=image_only
        )

        self.paginator.results_key = "attachments"
        self.paginator.page_size = self.paginator.get_page_size(request) or 10
        page = self.paginator.paginate_queryset(queryset, request)
        serializer = InstanceFileSerializer(page, many=True)
        return self.paginator.get_paginated_response(serializer.data)
