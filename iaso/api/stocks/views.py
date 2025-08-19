from datetime import datetime

import django_filters

from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from iaso.api.stocks.filters import (
    StockItemListFilter,
    StockItemRuleListFilter,
    StockKeepingUnitListFilter,
    StockLegderItemListFilter,
    StockRulesVersionListFilter,
)
from iaso.api.stocks.pagination import StockKeepingUnitPagination
from iaso.api.stocks.permissions import HasStockManagementFullPermission, HasStockManagementReadPermission
from iaso.api.stocks.serializers import (
    StockItemRuleSerializer,
    StockItemRuleUpdateSerializer,
    StockItemRuleWriteSerializer,
    StockItemSerializer,
    StockItemUpdateSerializer,
    StockItemWriteSerializer,
    StockKeepingUnitSerializer,
    StockKeepingUnitWriteSerializer,
    StockLedgerItemSerializer,
    StockLedgerItemWriteSerializer,
    StockRulesVersionSerializer,
    StockRulesVersionWriteSerializer,
)
from iaso.api.stocks.utils import make_deep_copy_with_relations
from iaso.models import (
    StockImpacts,
    StockItem,
    StockItemRule,
    StockKeepingUnit,
    StockLedgerItem,
    StockRulesVersion,
    StockRulesVersionsStatus,
)


class StockKeepingUnitViewSet(viewsets.ModelViewSet):
    """StockKeepingUnit API

    GET /api/stockkeepingunits/
    GET /api/stockkeepingunits/<id>/
    POST /api/stockkeepingunits/
    PATCH /api/stockkeepingunits/<id>/
    DELETE /api/stockkeepingunits/<id>/
    """

    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = StockKeepingUnitListFilter
    ordering_fields = [
        "id",
        "name",
        "short_name",
        "projects__name",
        "org_unit_type__name",
        "created_at",
        "updated_at",
        "created_by__username",
        "updated_by__username",
    ]
    http_method_names = ["get", "post", "patch", "delete"]
    pagination_class = StockKeepingUnitPagination

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return StockKeepingUnitSerializer

        return StockKeepingUnitWriteSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            StockKeepingUnit.objects.filter_for_user(user)
            .select_related("created_by", "updated_by")
            .prefetch_related("projects", "org_unit_types", "forms", "sku_children_parent")
            .order_by("id")
        )

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [HasStockManagementReadPermission]
        else:
            permission_classes = [HasStockManagementFullPermission]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """
        POST to create a `StockKeepingUnit`.
        """
        serializer.validated_data["account"] = self.request.user.iaso_profile.account
        serializer.validated_data["created_by"] = self.request.user
        serializer.validated_data["updated_by"] = self.request.user
        serializer.save()


class StockItemViewSet(viewsets.ModelViewSet):
    """StockItemView API

    GET /api/stockitems/
    GET /api/stockitems/<id>/
    POST /api/stockitems/
    PATCH /api/stockitems/<id>/
    DELETE /api/stockitems/<id>/
    """

    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = StockItemListFilter
    ordering_fields = [
        "id",
        "org_unit__name",
        "sku__name",
        "value",
        "created_at",
        "updated_at",
        "created_by__username",
        "updated_by__username",
    ]
    http_method_names = ["get", "post", "patch", "delete"]
    pagination_class = StockKeepingUnitPagination

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return StockItemSerializer
        if self.action == "partial_update":
            return StockItemUpdateSerializer
        return StockItemWriteSerializer

    def get_queryset(self):
        user = self.request.user
        return StockItem.objects.filter_for_user(user).select_related("sku", "org_unit").order_by("id")

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [HasStockManagementReadPermission]
        else:
            permission_classes = [HasStockManagementFullPermission]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """
        POST to create a `StockItem`.
        """
        if StockItem.objects.filter(
            sku=serializer.validated_data["sku"], org_unit=serializer.validated_data["org_unit"]
        ).exists():
            raise ValidationError("A `StockItem` already exists for this `sku` and this `org_unit`.")

        StockLedgerItem.objects.create(
            sku=serializer.validated_data["sku"],
            org_unit=serializer.validated_data["org_unit"],
            value=serializer.validated_data["value"],
            impact=StockImpacts.RESET,
            created_by=self.request.user,
            created_at=datetime.now(),
        )
        serializer.save()

    def partial_update(self, request, *args, **kwargs):
        """
        PATCH to edit a `StockItem`.
        """
        response = super().partial_update(request, *args, **kwargs)
        stock_item = self.get_object()

        StockLedgerItem.objects.create(
            sku=stock_item.sku,
            org_unit=stock_item.org_unit,
            value=stock_item.value,
            impact=StockImpacts.RESET,
            created_by=self.request.user,
            created_at=datetime.now(),
        )
        return response


class StockLedgerItemViewSet(viewsets.ModelViewSet):
    """StockLedgerItemView API

    GET /api/stockledgeritems/
    GET /api/stockledgeritems/<id>/
    POST /api/stockledgeritems/
    """

    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = StockLegderItemListFilter
    ordering_fields = [
        "id",
        "org_unit__name",
        "sku__name",
        "impact",
        "value",
        "submission__id",
        "created_at",
        "created_by__username",
    ]
    http_method_names = ["get", "post"]
    pagination_class = StockKeepingUnitPagination

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return StockLedgerItemSerializer

        return StockLedgerItemWriteSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            StockLedgerItem.objects.filter_for_user(user)
            .select_related("sku", "org_unit", "submission", "created_by")
            .order_by("id")
        )

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [HasStockManagementReadPermission]
        else:
            permission_classes = [HasStockManagementFullPermission]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """
        POST to create a `StockLedgerItem`.
        """
        serializer.validated_data["created_at"] = datetime.now()
        serializer.validated_data["created_by"] = self.request.user
        serializer.save()


class StockItemRuleViewSet(viewsets.ModelViewSet):
    """StockItemRuleView API

    GET /api/stockitemrules/
    GET /api/stockitemrules/<id>/
    POST /api/stockitemrules/
    PATCH /api/stockitemrules/<id>/
    DELETE /api/stockitemrules/<id>/
    """

    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = StockItemRuleListFilter
    ordering_fields = [
        "id",
        "form__name",
        "sku__name",
        "impactquestion",
        "submission__id",
        "created_at",
        "created_by__username",
        "updated_at",
        "updated_by__username",
    ]
    http_method_names = ["get", "post", "patch", "delete"]
    pagination_class = StockKeepingUnitPagination

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return StockItemRuleSerializer
        if self.action == "partial_update":
            return StockItemRuleUpdateSerializer
        return StockItemRuleWriteSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            StockItemRule.objects.filter_for_user(user)
            .select_related("sku", "form", "created_by", "updated_by")
            .order_by("id")
        )

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [HasStockManagementReadPermission]
        else:
            permission_classes = [HasStockManagementFullPermission]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """
        POST to create a `StockItemRule`.
        """
        if serializer.validated_data.get("version").status != StockRulesVersionsStatus.DRAFT:
            raise PermissionDenied("You can only create items for draft versions")

        serializer.validated_data["created_by"] = self.request.user
        serializer.validated_data["updated_by"] = self.request.user
        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.version.status != StockRulesVersionsStatus.DRAFT:
            raise PermissionDenied("You cannot update rules for finalized versions")
        return super().perform_update(serializer)

    def perform_destroy(self, instance: StockItemRule):
        if instance.version.status != StockRulesVersionsStatus.DRAFT:
            raise PermissionDenied("You cannot delete rules for finalized versions")
        return super().perform_destroy(instance)


class StockRulesVersionViewSet(viewsets.ModelViewSet):
    """StockItemRuleView API

    GET /api/stockrulesversions/
    GET /api/stockrulesversions/<id>/
    POST /api/stockrulesversions/
    PATCH /api/stockrulesversions/<id>/
    DELETE /api/stockrulesversions/<id>/
    """

    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = StockRulesVersionListFilter
    ordering_fields = [
        "id",
        "name",
        "status",
        "created_at",
        "created_by__username",
        "updated_at",
        "updated_by__username",
    ]
    http_method_names = ["get", "post", "patch", "delete"]
    pagination_class = StockKeepingUnitPagination
    lookup_url_kwarg = "version_id"

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return StockRulesVersionSerializer

        return StockRulesVersionWriteSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            StockRulesVersion.objects.filter_for_user(user)
            .select_related("created_by", "updated_by")
            .prefetch_related("rules", "rules__sku", "rules__form", "rules__created_by", "rules__updated_by")
            .order_by("id")
        )

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [HasStockManagementReadPermission]
        else:
            permission_classes = [HasStockManagementFullPermission]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """
        POST to create a `StockRulesVersion`.
        """
        serializer.validated_data["account"] = self.request.user.iaso_profile.account
        serializer.validated_data["created_by"] = self.request.user
        serializer.validated_data["updated_by"] = self.request.user
        serializer.save()

    @action(detail=True, methods=["post"])
    def copy(self, request, **kwargs) -> Response:
        """POST /api/stockrulesversions/{version_id}/copy
        Creates a new StockRules version by copying the exiting version given by {version_id}
        """

        version_id = request.query_params.get("version_id", kwargs.get("version_id"))
        v_orig = get_object_or_404(StockRulesVersion, id=version_id)
        new_v = make_deep_copy_with_relations(v_orig, self.request)
        serialized_data = StockRulesVersionSerializer(new_v, context=self.get_serializer_context()).data
        return Response(serialized_data)
