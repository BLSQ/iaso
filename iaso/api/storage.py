# TODO: need better type annotations in this file
from datetime import datetime
from typing import Tuple

from rest_framework import viewsets, permissions, serializers, status
from rest_framework.decorators import action, api_view
from rest_framework.mixins import CreateModelMixin, ListModelMixin
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from django.core.paginator import Paginator

from iaso.models import StorageLogEntry, StorageDevice, Instance, OrgUnit, Entity
from iaso.api.entity import EntitySerializer

from iaso.api.serializers import OrgUnitSerializer

from .common import TimestampField, HasPermission


class EntityNestedSerializer(EntitySerializer):
    class Meta:
        model = Entity
        fields = ["id", "name"]


class OrgUnitNestedSerializer(OrgUnitSerializer):
    class Meta:
        model = OrgUnit
        fields = [
            "id",
            "name",
        ]


# This is actually unused (by POST)
class StorageLogSerializer(serializers.ModelSerializer):
    storage_id = serializers.CharField(source="device.customer_chosen_id")
    storage_type = serializers.CharField(source="device.type")
    entity = EntityNestedSerializer(read_only=True)
    org_unit = OrgUnitNestedSerializer(read_only=True)
    performed_at = TimestampField(read_only=True)

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
    reason = serializers.CharField(source="status_reason", required=False)
    # TODO: where should this data come from
    # updated_at = serializers.DateTimeField()
    # TODO: Comment field is not in the spec, but I guess it's useful to implement, no?
    comment = serializers.CharField(source="status_comment", required=False, allow_blank=True)

    def validate(self, data):
        """
        Ensure that a reason is set if changed to a non-ok status
        """
        if data["status"] != StorageDevice.OK and not data["status_reason"]:
            raise serializers.ValidationError("A reason must be provided when changing the status to a non-ok status")
        return data


class StorageSerializer(serializers.ModelSerializer):
    storage_id = serializers.CharField(source="customer_chosen_id")
    storage_type = serializers.CharField(source="type")
    status = StorageStatusSerializer(source="*")
    entity = EntityNestedSerializer(read_only=True)
    org_unit = OrgUnitNestedSerializer(read_only=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    class Meta:
        model = StorageDevice
        fields: Tuple[str, ...] = (
            "updated_at",
            "created_at",
            "storage_id",
            "storage_type",
            "status",
            "org_unit",
            "entity",
        )


class StorageSerializerWithLogs(StorageSerializer):
    """Like StorageSerializer, but also includes the log entries"""

    logs = StorageLogSerializer(many=True, source="log_entries")

    class Meta(StorageSerializer.Meta):
        fields = StorageSerializer.Meta.fields + ("logs",)


class StorageViewSet(ListModelMixin, viewsets.GenericViewSet):
    # TODO: clarify permissions (the doc says "permission to see storage)
    # For now we'll check that user is authenticated, and we filter by account
    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_storage")]
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
            qs = qs.filter(type__in=filter_type.split(","))

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
        # TODO: responses when insufficient permissions

        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        order = request.GET.get("order", "updated_at").split(",")

        queryset = self.get_queryset()
        queryset = queryset.order_by(*order)
        serializer = StorageSerializer

        if limit:
            limit = int(limit)
            page_offset = int(page_offset)
            paginator = Paginator(queryset, limit)
            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)
            res["results"] = serializer(page.object_list, many=True).data
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit
            return Response(res)
        else:
            return Response(StorageSerializer(queryset, many=True).data)

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
                reason=status_dict.get("status_reason", ""),
                comment=status_dict.get("status_comment", ""),
                performed_by=user,
            )
            return Response({}, status=200)
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


@api_view()
def logs_per_device(request, storage_customer_chosen_id: str, storage_type: str):
    """Return a list of log entries for a given device"""
    user_account = request.user.iaso_profile.account

    # TODO: implement permissions and return 403/401 (see spec)
    # TODO: spec says: "permissions to see storage", what does it mean exactly?

    device = StorageDevice.objects.get(
        customer_chosen_id=storage_customer_chosen_id, type=storage_type, account=user_account
    )

    # TODO: implement filtering
    # TODO: implement pagination

    return Response(StorageSerializerWithLogs(device).data)


class StorageBlacklistedViewSet(ListModelMixin, viewsets.GenericViewSet):
    queryset = StorageDevice.objects.filter(status=StorageDevice.BLACKLISTED)
    serializer_class = StorageSerializer

    # TODO: check permissions if necessary (everybody can get the list of blacklisted devices accross all accounts, correct?)
    permission_classes = [AllowAny]
    # TODO: according to spec, we should add an "updated_at" field
    # TODO: implement pagination
    # TODO: clarify, then implement the "since" feature -see specs-

    def list(self, request):
        """
        GET /api/mobile/storage/blacklisted

        Returns a list of blacklisted devices
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({"storages": serializer.data})
