from drf_spectacular.utils import extend_schema
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.response import Response

from iaso.api.stocks.permissions import HasStockManagementFullPermission
from iaso.api.tasks.serializers import TaskSerializer
from iaso.models import StockKeepingUnit, StockRulesVersion
from iaso.tasks.apply_stock_rules import apply_stock_rules


class ApplyStockRulesSerializer(serializers.Serializer):
    sku_id = serializers.IntegerField(required=True)
    start_date = serializers.DateField(required=False, allow_null=True, default=None)
    end_date = serializers.DateField(required=False, allow_null=True, default=None)

    def validate_sku_id(self, sku_id: int) -> int:
        request = self.context["request"]
        if not StockKeepingUnit.objects.filter_for_user(request.user).filter(id=sku_id).exists():
            raise serializers.ValidationError("StockKeepingUnit not found.")
        return sku_id

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({"end_date": "end_date must be greater than or equal to start_date."})

        request = self.context["request"]
        if not StockRulesVersion.objects.filter_for_user(request.user).filter_published().exists():
            raise serializers.ValidationError("No published stock rules version found for this account.")

        return attrs


class ApplyStockRulesResponseSerializer(serializers.Serializer):
    task = TaskSerializer(read_only=True)


@extend_schema(tags=["Apply stock rules"])
class ApplyStockRulesViewSet(viewsets.ViewSet):
    """Apply the currently published stock rules set to historical Instances for a StockKeepingUnit."""

    permission_classes = [permissions.IsAuthenticated, HasStockManagementFullPermission]
    serializer_class = ApplyStockRulesSerializer

    @extend_schema(
        request=ApplyStockRulesSerializer,
        responses={status.HTTP_201_CREATED: ApplyStockRulesResponseSerializer},
    )
    def create(self, request):
        serializer = ApplyStockRulesSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        start_date = serializer.validated_data["start_date"]
        end_date = serializer.validated_data["end_date"]

        task = apply_stock_rules(
            sku_id=serializer.validated_data["sku_id"],
            start_date=start_date.isoformat() if start_date else None,
            end_date=end_date.isoformat() if end_date else None,
            user=request.user,
        )
        return Response(
            ApplyStockRulesResponseSerializer({"task": task}).data,
            status=status.HTTP_201_CREATED,
        )
