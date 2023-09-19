from iaso.api.common import ModelViewSet, HasPermission
from iaso.models import StockItem, StockMovement, OrgUnit
from rest_framework import permissions, serializers, filters
from hat.menupermissions import models as permission


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
