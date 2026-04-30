from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework import filters

from plugins.polio.api.vaccines.permissions import OutgoingStockMovementPermission
from plugins.polio.api.vaccines.stock_management.outgoingstockmovement.serializers import (
    OutgoingStockMovementPatchSerializer,
    OutgoingStockMovementSerializer,
    OutgoingStockMovementStrictSerializer,
)
from plugins.polio.api.vaccines.stock_management.subitems import VaccineStockSubitemBase
from plugins.polio.models import EarmarkedStock, OutgoingStockMovement
from plugins.polio.permissions import (
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
)


@extend_schema(tags=["Polio - Outgoing stock movements"])
class OutgoingStockMovementViewSet(VaccineStockSubitemBase):
    model_class = OutgoingStockMovement
    permission_classes = [
        lambda: OutgoingStockMovementPermission(
            admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
        )
    ]
    filter_backends = [
        filters.OrderingFilter,
    ]
    ordering_fields = ["report_date", "form_a_reception_date", "doses_per_vial"]

    def get_serializer_class(self):
        if self.action == "partial_update":
            return OutgoingStockMovementPatchSerializer
        return OutgoingStockMovementStrictSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context[OutgoingStockMovementSerializer.VALIDATE_FORM_A_LIFECYCLE_CONTEXT_KEY] = self.action in (
            "create",
            "update",
            "partial_update",
        )
        return context

    def get_queryset(self):
        vaccine_stock_id = self.request.query_params.get("vaccine_stock")

        base_queryset = OutgoingStockMovement.objects.all()

        if vaccine_stock_id is None:
            qs = base_queryset.filter(vaccine_stock__account=self.request.user.iaso_profile.account)
        else:
            qs = base_queryset.filter(
                vaccine_stock=vaccine_stock_id, vaccine_stock__account=self.request.user.iaso_profile.account
            )

        if self.action in ("update", "partial_update"):
            qs = qs.select_for_update()

        return qs

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)

        # When Form A is created, find if there is a matching earmarked stock
        # and create a new earmarked stock of type USED with the same values
        if response.status_code == 201:
            movement = OutgoingStockMovement.objects.filter(id=response.data["id"]).first()
            if movement and movement.round and movement.vaccine_stock:
                total_vials_usable = EarmarkedStock.get_available_vials_count(
                    movement.vaccine_stock, movement.round, movement.doses_per_vial
                )

                vials_earmarked_used = min(total_vials_usable, movement.usable_vials_used)
                doses_earmarked_used = vials_earmarked_used * movement.doses_per_vial

                if vials_earmarked_used > 0:
                    EarmarkedStock.objects.create(
                        vaccine_stock=movement.vaccine_stock,
                        campaign=movement.campaign,
                        round=movement.round,
                        earmarked_stock_type=EarmarkedStock.EarmarkedStockChoices.USED,
                        vials_earmarked=vials_earmarked_used,
                        doses_earmarked=doses_earmarked_used,
                        comment="Created from Form A submission",
                        form_a=movement,
                        doses_per_vial=movement.doses_per_vial,
                    )

        return response
