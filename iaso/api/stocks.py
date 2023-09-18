from iaso.api.common import ModelViewSet, HasPermission
from iaso.models import StockItem, StockMovement, OrgUnit
from rest_framework import viewsets, permissions, serializers
from hat.menupermissions import models as permission


class StockItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockItem
        fields = ["id", "name"]

    def create(self, validated_data):
        profile = self.context["request"].user.iaso_profile
        wfv = StockItem.objects.create(account=profile.account, **validated_data)
        return wfv


class StockItemViewSet(ModelViewSet):
    f"""Stock Items API

    This API is restricted to authenticated authenticated users having the permission "{permission.STOCKS}"
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(permission.STOCKS),  # type: ignore
    ]

    model = StockItem
    serializer_class = StockItemSerializer
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        profile = self.request.user.iaso_profile
        qs = StockItem.objects.filter(account=profile.account).order_by("id")
        return qs

    # def destroy(self, request, pk=None):
    #     profile = request.user.iaso_profile
    #     existing = StockItem.objects.get(id=pk)
    #     if existing.account != profile.account:
    #         raise ValueError("You can only delete stock items from your own account")

    #     return super().destroy(request, pk)


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


class PostStockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = ["id", "stock_item", "org_unit", "quantity", "creation_date"]

    def create(self, validated_data):
        profile = self.context["request"].user.iaso_profile
        stock_move = StockMovement.objects.create(account=profile.account, **validated_data)
        return stock_move


class GetStockMovementSerializer(serializers.ModelSerializer):
    stock_item = EmbeddedStockItemSerializer()
    org_unit = EmbeddedOrgUnitSerializer()

    class Meta:
        model = StockMovement
        fields = ["id", "stock_item", "org_unit", "quantity", "creation_date"]


class StockMovementViewSet(ModelViewSet):
    f"""Stock Movements API

    This API is restricted to authenticated users having the permission "{permission.STOCKS}"
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(permission.STOCKS),  # type: ignore
    ]

    model = StockMovement
    http_method_names = ["get", "post", "delete"]

    def get_serializer_class(self):
        if self.action == "list":
            return GetStockMovementSerializer
        elif self.action == "create":
            return PostStockMovementSerializer
        elif self.action == "destroy":
            return PostStockMovementSerializer
        else:
            raise Exception("Unknown action")

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
