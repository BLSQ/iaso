from datetime import datetime

from rest_framework import viewsets, permissions, serializers, status
from rest_framework.mixins import CreateModelMixin
from rest_framework.response import Response

from iaso.models import StorageLogEntry, StorageDevice, Instance, OrgUnit, Entity


class StorageLogSerializer(serializers.ModelSerializer):
    storage_id = serializers.CharField(source="device.customer_chosen_id")
    storage_type = serializers.CharField(source="device.type")

    class Meta:
        model = StorageLogEntry
        fields = [
            "id",
            "storage_id",
            "storage_type",
            "operation_type",
            "instances",
            "org_unit",
            "entity",
            "performed_at",
        ]

    def create(self, validated_data):
        pass


# This could be rewritten in more idiomatic DRF (serializers, ...). On the other hand, I quite like the explicitness
class StorageLogViewSet(CreateModelMixin, viewsets.GenericViewSet):
    """This ViewSet gives access to the storage log entries"""

    serializer_class = StorageLogSerializer
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def create(self, request):
        """
        POST /api/mobile/storage/logs

        This will also create a new StorageDevice if the storage_id / storage_type / account combination is not found
        """
        # 1) Get data out of request
        user = request.user

        body = request.data[0]
        log_id = body["id"]
        storage_id = body["storage_id"]
        storage_type = body["storage_type"]
        operation_type = body["operation_type"]
        performed_at = datetime.utcfromtimestamp(body["performed_at"])  # timestamp, but Python already expects that

        concerned_instances = Instance.objects.filter(id__in=body["instances"])
        concerned_orgunit = OrgUnit.objects.get(id=body["org_unit_id"])
        concerned_entity = Entity.objects.get(id=body["entity_id"])

        account = user.iaso_profile.account

        # 1. Create the storage device, if needed
        device, _ = StorageDevice.objects.get_or_create(
            account=account, customer_chosen_id=storage_id, type=storage_type
        )

        # 2. Create the log entry
        log_entry = StorageLogEntry.objects.create(
            id=log_id,
            device=device,
            operation_type=operation_type,
            performed_at=performed_at,
            performed_by=user,
            org_unit=concerned_orgunit,
            entity=concerned_entity,
        )

        log_entry.instances.set(concerned_instances)

        return Response("", status=status.HTTP_201_CREATED)
