# TODO: need better type annotations in this file
from datetime import datetime

from rest_framework import viewsets, permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin, ListModelMixin
from rest_framework.response import Response

from iaso.models import StorageLogEntry, StorageDevice, Instance, OrgUnit, Entity


# This is actually unused (by POST)
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


class StorageStatusSerializer(serializers.Serializer):
    status = serializers.CharField()
    reason = serializers.CharField(source="status_reason")
    # TODO: where should this data come from
    # updated_at = serializers.DateTimeField()
    # TODO: Comment field is not in the spec, but I guess it's useful to implement, no?
    comment = serializers.CharField(source="status_comment")


class StorageSerializer(serializers.ModelSerializer):
    storage_id = serializers.CharField(source="customer_chosen_id")
    storage_type = serializers.CharField(source="type")
    status = StorageStatusSerializer(source="*")
    # TODO: missing fields according to spec:
    # - created at (what is it? created in the backend? from the timestamp of the storage log that created it?
    # - updated at (what is it: last log entry? last time a device field was updated?)
    # - org_unit? From the last log entry (that mentions a orgunit)?
    # - entity? From the last log entry (that mentions an entity)?

    class Meta:
        model = StorageDevice
        fields = ("storage_id", "storage_type", "status")


class StorageViewSet(ListModelMixin, viewsets.GenericViewSet):
    # TODO: clarify permissions (the doc says "permission to see storage)
    # For now we'll check that user is authenticated, and we filter by account
    permission_classes = [
        permissions.IsAuthenticated,
    ]
    serializer_class = StorageSerializer

    def get_queryset(self):
        """Devices get filtered by account, and optionally by a few URL parameters"""

        # In all cases, we'll only return results for the account of the user
        qs = StorageDevice.objects.filter(account=self.request.user.iaso_profile.account)

        # There are also a few optional URL filters
        filter_status = self.request.query_params.get("status")
        if filter_status is not None:
            qs = qs.filter(status=filter_status)

        filter_reason = self.request.query_params.get("reason")
        if filter_reason is not None:
            qs = qs.filter(status_reason=filter_reason)

        filter_type = self.request.query_params.get("type")
        if filter_type is not None:
            qs = qs.filter(type=filter_type)

        filter_search = self.request.query_params.get("search")
        if filter_search is not None:
            # TODO: implement: search on entity or storage id
            pass

        return qs

    def list(self, request):
        """
        Endpoint used to list/search devices on the web interface

        GET /api/storage/
        """
        # TODO: implement pagination
        # TODO: responses when insufficient permissions
        queryset = self.get_queryset()

        serializer = self.get_serializer(queryset, many=True)
        return Response({"storages": serializer.data})

    @action(detail=False, methods=["post"])
    def blacklisted(self, request):
        """
        Endpoint used to blacklist a single device from the web interface

        POST /api/storage/blacklisted/
        """
        # TODO: permissions: spec mentions "permission to modify storage", what does it mean exactly?
        #  Clarify then implement

        # 1. Get data from request/environment
        user = request.user
        body = request.data
        storage_id = body.get("storage_id")
        storage_type = body.get("storage_type")
        storage_status_dict = body.get("storage_status")
        account = user.iaso_profile.account

        # 2. Preprocess submitted data
        try:
            device = StorageDevice.objects.get(customer_chosen_id=storage_id, type=storage_type, account=account)
        except StorageDevice.DoesNotExist:
            device = None

        status_serializer = StorageStatusSerializer(data=storage_status_dict)

        if device is not None and status_serializer.is_valid():
            # 3. Submitted data is valid, we can now proceed
            status_dict = status_serializer.validated_data
            # 3.1 Update device status
            device.change_status(
                new_status=status_dict["status"],
                reason=status_dict["status_reason"],
                comment=status_dict["status_comment"],
                performed_by=user,
            )
            return Response("", status=status.HTTP_204_NO_CONTENT)

        else:  # Some parameters were invalid
            # TODO: return a 400 error here?
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
