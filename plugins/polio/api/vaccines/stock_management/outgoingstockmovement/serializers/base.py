import os

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.utils.virus_scan.serializers import ModelWithFileSerializer
from plugins.polio.api.vaccines.permissions import (
    has_vaccine_stock_edit_access,
    is_within_management_edit_window,
)
from plugins.polio.api.vaccines.stock_management.campaign import compute_category_from_campaign
from plugins.polio.models import OutgoingStockMovement, VaccineStock
from plugins.polio.permissions import (
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
)

from .constants import VALIDATE_FORM_A_LIFECYCLE_CONTEXT_KEY
from .lifecycle import OutgoingStockMovementFormALifecycleMixin
from .writes import OutgoingStockMovementWriteMixin


class OutgoingStockMovementSerializer(
    OutgoingStockMovementWriteMixin,
    OutgoingStockMovementFormALifecycleMixin,
    ModelWithFileSerializer,
):
    VALIDATE_FORM_A_LIFECYCLE_CONTEXT_KEY = VALIDATE_FORM_A_LIFECYCLE_CONTEXT_KEY

    EDIT_ACCESS_NONE = "none"
    EDIT_ACCESS_COMPLETION_ONLY = "completion_only"
    EDIT_ACCESS_FULL = "full"

    campaign = serializers.CharField(source="campaign.obr_name", required=False)
    # reference to a campaign not managed in iaso. Is used as an alternative to the campaign/obr name used for regular campaigns
    alternative_campaign = serializers.CharField(source="non_obr_name", required=False)
    round_number = serializers.SerializerMethodField()
    # Single enum describing what the current user is allowed to edit on this row.
    # "none": no edit path (read-only or post-window non-temporary for non-admin).
    # "completion_only": only TEMPORARY_FORM_A_COMPLETION_FIELDS editable (non-admin
    #   completing a temporary Form A past the edit window).
    # "full": all fields editable (admin at any time, or non-admin within the window).
    edit_access = serializers.SerializerMethodField()
    within_edit_window = serializers.SerializerMethodField()
    campaign_category = serializers.SerializerMethodField()

    class Meta:
        model = OutgoingStockMovement
        fields = [
            "id",
            "status",
            "campaign",
            "vaccine_stock",
            "report_date",
            "form_a_reception_date",
            "usable_vials_used",
            "lot_numbers",
            "scan_result",
            "scan_timestamp",
            "file",
            "comment",
            "round",
            "round_number",
            "edit_access",
            "within_edit_window",
            "alternative_campaign",
            "campaign_category",
            "doses_per_vial",
        ]

    def get_round_number(self, obj):
        return obj.round.number if obj.round else None

    @extend_schema_field(
        serializers.ChoiceField(
            choices=[EDIT_ACCESS_NONE, EDIT_ACCESS_COMPLETION_ONLY, EDIT_ACCESS_FULL],
            read_only=True,
        )
    )
    def get_edit_access(self, obj):
        user = self.context["request"].user
        # Full edit: admin at any time, or non-admin within the generic edit window.
        if has_vaccine_stock_edit_access(
            user,
            obj.created_at,
            admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
        ):
            return self.EDIT_ACCESS_FULL
        # Completion-only: temporary Form A past the edit window stays editable for
        # completion (TEMPORARY_FORM_A_COMPLETION_FIELDS only; enforced server-side).
        if obj.status == OutgoingStockMovement.StatusChoices.TEMPORARY and user.has_perm(
            POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION.full_name()
        ):
            return self.EDIT_ACCESS_COMPLETION_ONLY
        return self.EDIT_ACCESS_NONE

    @extend_schema_field(serializers.BooleanField(read_only=True))
    def get_within_edit_window(self, obj):
        if obj.created_at is None:
            return False
        return is_within_management_edit_window(obj.created_at, days_open=VaccineStock.MANAGEMENT_DAYS_OPEN)

    def get_campaign_category(self, obj):
        return compute_category_from_campaign(obj.campaign, obj.round)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.file:
            ret["file"] = {
                "path": instance.file.url,
                "name": os.path.basename(instance.file.name),
            }
        else:
            ret["file"] = None
        return ret
