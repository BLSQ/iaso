import django_filters

from django.db.models import Prefetch
from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response

from iaso.api.apps import viewsets
from iaso.api.serializers import AppIdSerializer
from iaso.api.stocks.filters import MobileStockLedgerItemListFilter
from iaso.api.stocks.pagination import StockKeepingUnitPagination
from iaso.api.stocks.serializers import (
    StockLedgerItemWriteSerializer,
)
from iaso.api.stocks.serializers_mobile import (
    StockKeepingUnitMobileSerializer,
    StockLedgerItemMobileSerializer,
    StockRulesVersionMobileSerializer,
)
from iaso.api.stocks.utils import import_stock_ledger_items
from iaso.models import (
    Form,
    OrgUnitType,
    Project,
    StockItemRule,
    StockKeepingUnit,
    StockLedgerItem,
    StockRulesVersion,
)


class StockKeepingUnitMobileViewSet(viewsets.ModelViewSet):
    """StockKeepingUnitMobileView API

    GET /api/mobile/stockkeepingunits/?app_id=<app_id>
    """

    http_method_names = ["get"]
    pagination_class = StockKeepingUnitPagination
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StockKeepingUnitMobileSerializer

    def get_queryset(self):
        user = self.request.user
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)
        project = Project.objects.get_for_user_and_app_id(user, app_id)
        return (
            StockKeepingUnit.objects.filter_for_project(project)
            .filter(deleted_at=None)
            .prefetch_related(
                Prefetch("org_unit_types", OrgUnitType.objects.filter_for_project(project).only("id")),
                Prefetch("forms", Form.objects.filter_for_project(project).only("id")),
            )
            .order_by("id")
        )


class StockLedgerItemMobileViewSet(viewsets.ModelViewSet):
    """StockLedgerItemMobileView API

    GET /api/mobile/stockledgeritems/?app_id=<app_id>
    POST /api/mobile/stockledgeritems/?app_id=<app_id>
    """

    http_method_names = ["get", "post"]
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = MobileStockLedgerItemListFilter
    pagination_class = StockKeepingUnitPagination
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return StockLedgerItemMobileSerializer

        return StockLedgerItemWriteSerializer

    def get_queryset(self):
        user = self.request.user
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)
        return (
            StockLedgerItem.objects.filter_for_user_and_app_id(user, app_id)
            .select_related("sku", "org_unit", "submission", "created_by")
            .order_by("id")
        )

    def create(self, request, *args, **kwargs):
        """
        POST to create a `StockLedgerItem`.
        """
        user = self.request.user
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)
        import_stock_ledger_items(user, app_id, request.data, self.get_queryset())
        headers = self.get_success_headers(request.data)
        return Response(request.data, status=status.HTTP_201_CREATED, headers=headers)


class StockRulesVersionMobileViewSet(viewsets.ModelViewSet):
    """StockRulesVersionMobileView API

    GET /api/mobile/stockrules/?app_id=<app_id>
    """

    http_method_names = ["get"]
    pagination_class = None
    results_key = None
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StockRulesVersionMobileSerializer

    def get_queryset(self):
        user = self.request.user
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)
        project = Project.objects.get_for_user_and_app_id(user, app_id)
        return (
            StockRulesVersion.objects.filter_for_project(project)
            .filter_published()
            .filter(deleted_at=None)
            .select_related("created_by", "updated_by")
            .prefetch_related(
                Prefetch("rules", StockItemRule.objects.filter_for_project(project)),
                Prefetch("rules__sku", StockKeepingUnit.objects.filter_for_project(project)),
                Prefetch("rules__form", Form.objects.filter_for_project(project)),
            )
            .order_by("id")
        )

    def list(self, request: Request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        published_rules = queryset.first()
        if published_rules is None:
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = self.get_serializer(published_rules, many=False)
        return Response(serializer.data)
