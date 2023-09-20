from typing import Type
from rest_framework.serializers import BaseSerializer
from iaso.api.common import ModelViewSet, HasPermission
from iaso.models import StockItem, StockMovement, OrgUnit
from rest_framework import permissions, serializers, filters
from hat.menupermissions import models as permission
from django.shortcuts import get_object_or_404


class StockItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockItem
        fields = ("id", "name")

    def create(self, validated_data):
        profile = self.context["request"].user.iaso_profile
        stock_item = StockItem.objects.create(account=profile.account, name=validated_data["name"])
        return stock_item


class StockItemViewSet(ModelViewSet):
    """
    Stock Items API

    This API is restricted to authenticated users, having the permission `permission.STOCK`
    GET `/api/stock/items/` return a list of stock items
    GET `/api/stock/items/{id}/` return details for a single stock item
    POST `/api/stock/items/` with a body `{"name": "my item"}` to create a stock item
    DELETE `/api/stock/items/{id}/` to delete this item
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.STOCKS)]
    model = StockItem
    serializer_class = StockItemSerializer
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        profile = self.request.user.iaso_profile
        qs = StockItem.objects.filter(account=profile.account)
        return qs


class EmbeddedStockItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockItem
        fields = ["id", "name"]
        read_only_fields = ["name"]


class EmbeddedOrgUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name"]
        read_only_fields = ["name"]


class GetStockMovementSerializer(serializers.ModelSerializer):
    stock_item = EmbeddedStockItemSerializer()
    org_unit = EmbeddedOrgUnitSerializer()

    class Meta:
        model = StockMovement
        fields = ["id", "stock_item", "org_unit", "quantity", "creation_date"]


class PostStockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = ["id", "stock_item", "org_unit", "quantity", "creation_date"]

    def create(self, validated_data):
        profile = self.context["request"].user.iaso_profile
        stock_move = StockMovement.objects.create(account=profile.account, **validated_data)
        return stock_move


class StockMovementCustomFilter(filters.BaseFilterBackend):
    # filter by orgunit id
    # filter by stock items ids (comma separated)
    def filter_queryset(self, request, queryset, view):
        org_unit_id = request.GET.get("orgunit", None)
        stock_items_ids_str = request.GET.get("stockitems", None)  # "1,2,3"
        stock_items_ids = stock_items_ids_str.split(",") if stock_items_ids_str else None

        if org_unit_id is not None:
            queryset = queryset.filter(org_unit__id=org_unit_id)  # SELECT org_unit WHERE id = {org_unit_id}

        if stock_items_ids is not None:
            queryset = queryset.filter(stock_item__id__in=stock_items_ids)  # SELECT stock_item WHERE id IN (1,2,3)

        return queryset


class StockMovementViewSet(ModelViewSet):
    """Stock Movements API

    This API is restricted to authenticated users having the permission 'permission.STOCKS'
    GET `/api/stock/movements/` for a list of movements
    GET `/api/stock/movements/{id}/` for a single one
    GET `/api/stock/movements/?order=-stock_item` for ordering by stock_item id (descending)
    GET `/api/stock/movements/?order=org_unit` for ordering by org_unit id (ascending)
    GET `/api/stock/movements/?orgunit=123&stockitems=1,2,3` for filtering by orgunit id and stock items ids
    POST `/api/stock/movements/` with a body like `{"stock_item": 1, "org_unit": 123, "quantity": 10}` to create
    DELETE `/api/stock/movements/123/` to delete
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.STOCKS)]
    model = StockMovement
    http_method_names = ["get", "post", "delete"]
    filter_backends = [filters.OrderingFilter, StockMovementCustomFilter]
    ordering_fields = ["org_unit", "stock_item", "quantity", "creation_date"]

    def get_serializer_class(self):
        if self.action == "create":
            return PostStockMovementSerializer
        else:
            return GetStockMovementSerializer

    def get_queryset(self):
        profile = self.request.user.iaso_profile
        qs = StockMovement.objects.filter(account=profile.account, org_unit__version=profile.account.default_version)
        return qs

    def destroy(self, request, pk=None):
        profile = request.user.iaso_profile
        existing = StockMovement.objects.get(id=pk)
        if existing.account != profile.account:
            raise ValueError("You can only delete stock movements from your own account")

        return super().destroy(request, pk)
