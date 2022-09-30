from rest_framework import viewsets, permissions
from rest_framework.mixins import CreateModelMixin


class StorageLogViewSet(CreateModelMixin, viewsets.GenericViewSet):
    """This ViewSet gives access to the storage log entries"""

    permission_classes = [
        permissions.IsAuthenticated,
    ]
