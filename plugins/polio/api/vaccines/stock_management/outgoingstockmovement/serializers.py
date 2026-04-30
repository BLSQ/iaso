import os

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.utils.virus_scan.serializers import ModelWithFileSerializer
from plugins.polio.api.vaccines.permissions import (
    TEMPORARY_FORM_A_COMPLETION_FIELDS,
    has_vaccine_stock_edit_access,
    is_within_management_edit_window,
)
from plugins.polio.api.vaccines.stock_management.campaign import compute_category_from_campaign
from plugins.polio.models import Campaign, OutgoingStockMovement, VaccineStock
from plugins.polio.permissions import (
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
)


class OutgoingStockMovementSerializer(ModelWithFileSerializer):
    # Set True by OutgoingStockMovementViewSet.get_serializer_context on write actions.
    VALIDATE_FORM_A_LIFECYCLE_CONTEXT_KEY = "validate_form_a_lifecycle"

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

    def _validate_editable_fields_based_on_status(self, status_value, form_a_reception_date, uploaded_file):
        if status_value == OutgoingStockMovement.StatusChoices.TEMPORARY and form_a_reception_date is not None:
            raise serializers.ValidationError(
                {"form_a_reception_date": "form_a_reception_date must be empty when status is temporary"}
            )
        if status_value == OutgoingStockMovement.StatusChoices.TEMPORARY and uploaded_file:
            raise serializers.ValidationError({"file": "file cannot be provided when status is temporary"})

        if status_value == OutgoingStockMovement.StatusChoices.RECEIVED and form_a_reception_date is None:
            raise serializers.ValidationError(
                {"form_a_reception_date": "form_a_reception_date is required when status is received"}
            )

    def _is_after_edit_window(self):
        if not self.instance or self.instance.created_at is None:
            return False
        return not is_within_management_edit_window(
            self.instance.created_at,
            days_open=VaccineStock.MANAGEMENT_DAYS_OPEN,
        )

    def _enforce_temporary_vials_immutability(self, data, resulting_status):
        if not self.instance or self.instance.status != OutgoingStockMovement.StatusChoices.TEMPORARY:
            return

        if resulting_status != OutgoingStockMovement.StatusChoices.TEMPORARY:
            return

        if data.get("usable_vials_used", self.instance.usable_vials_used) != self.instance.usable_vials_used:
            raise serializers.ValidationError(
                {"usable_vials_used": "usable_vials_used cannot be edited once a temporary Form A is created"}
            )

    def _validate_temporary_after_window_allowed_fields(self, resulting_status):
        if not self.instance:
            return

        if resulting_status != OutgoingStockMovement.StatusChoices.TEMPORARY:
            return

        if not self._is_after_edit_window():
            return

        requested_fields = set(self.initial_data.keys())
        if requested_fields - TEMPORARY_FORM_A_COMPLETION_FIELDS:
            raise serializers.ValidationError(
                {
                    "error": (
                        "Only status, form_a_reception_date, file and comment can be edited "
                        "for temporary forms after the edit window"
                    )
                }
            )

    def validate(self, data):
        """
        Validate against the resulting object state (existing instance + incoming payload).

        Rationale:
        - PATCH requests are often partial; validating only input would allow invariant
          bypasses when invalid combinations already exist on the instance.
        - Backend remains the source of truth for lifecycle rules, regardless of UI
          behavior or legacy data quality.
        """
        validated_data = super().validate(data)
        # The `source` attribute is used as the key in `data` instead of the name of the serializer field.
        current_campaign = self.instance.campaign if self.instance else None
        current_non_obr_name = self.instance.non_obr_name if self.instance else None
        campaign_value = validated_data.get("campaign", current_campaign)
        non_obr_name_value = validated_data.get("non_obr_name", current_non_obr_name)
        if campaign_value and non_obr_name_value:
            raise serializers.ValidationError({"error": "campaign and alternative campaign cannot both be defined"})

        if self.context.get(self.VALIDATE_FORM_A_LIFECYCLE_CONTEXT_KEY):
            current_status = self.instance.status if self.instance else None
            current_form_a_reception_date = self.instance.form_a_reception_date if self.instance else None
            current_file = self.instance.file if self.instance else None

            status_value = validated_data.get("status", current_status)
            is_received_to_temporary = (
                self.instance is not None
                and current_status == OutgoingStockMovement.StatusChoices.RECEIVED
                and status_value == OutgoingStockMovement.StatusChoices.TEMPORARY
            )
            form_a_reception_date = validated_data.get("form_a_reception_date", current_form_a_reception_date)
            uploaded_file = validated_data.get("file", current_file)
            if is_received_to_temporary:
                # Transition normalization: received -> temporary clears reception metadata.
                form_a_reception_date = None
                uploaded_file = None
            # Validation precedence:
            # 1) lifecycle compatibility (temporary vs received field rules)
            # 2) temporary vials immutability
            # 3) temporary post-window completion-field allowlist
            self._validate_editable_fields_based_on_status(status_value, form_a_reception_date, uploaded_file)
            self._enforce_temporary_vials_immutability(data, status_value)
            self._validate_temporary_after_window_allowed_fields(status_value)

        return validated_data

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

    def extract_campaign_data(self, validated_data):
        campaign_data = validated_data.pop("campaign", None)
        if campaign_data:
            campaign_obr_name = campaign_data.get("obr_name")
            campaign = Campaign.objects.get(
                obr_name=campaign_obr_name,
                account=self.context["request"].user.iaso_profile.account,
            )
            return campaign
        return None

    def create(self, validated_data):
        campaign = self.extract_campaign_data(validated_data)
        if campaign:
            validated_data["campaign"] = campaign
        self.scan_file_if_exists(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        campaign = self.extract_campaign_data(validated_data)
        if campaign:
            instance.campaign = campaign
        next_status = validated_data.get("status", instance.status)
        is_received_to_temporary = (
            instance.status == OutgoingStockMovement.StatusChoices.RECEIVED
            and next_status == OutgoingStockMovement.StatusChoices.TEMPORARY
        )
        if is_received_to_temporary:
            if instance.file:
                instance.file.delete(save=False)
            validated_data["file"] = None
            validated_data["form_a_reception_date"] = None
        else:
            self.scan_file_if_exists(validated_data, instance)
        return super().update(instance, validated_data)

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


class OutgoingStockMovementStrictSerializer(OutgoingStockMovementSerializer):
    def validate(self, data):
        # The `source` attribute is used as the key in `data` instead of the name of the serializer field.
        if data.get("campaign", None) is None and data.get("non_obr_name", None) is None:
            raise serializers.ValidationError(
                {"error": "At least one of 'campaign' or 'alternative campaign' must be provided"}
            )
        validated_data = super().validate(data)
        return validated_data


class OutgoingStockMovementPatchSerializer(OutgoingStockMovementSerializer):
    campaign = serializers.CharField(source="campaign.obr_name", required=False, allow_null=True)
    alternative_campaign = serializers.CharField(source="non_obr_name", required=False, allow_blank=True)
