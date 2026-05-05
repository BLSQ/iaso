from rest_framework import serializers

from plugins.polio.api.vaccines.permissions import (
    TEMPORARY_FORM_A_COMPLETION_FIELDS,
    is_within_management_edit_window,
)
from plugins.polio.models import OutgoingStockMovement, VaccineStock

from .constants import VALIDATE_FORM_A_LIFECYCLE_CONTEXT_KEY


class OutgoingStockMovementFormALifecycleMixin:
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

        if self.context.get(VALIDATE_FORM_A_LIFECYCLE_CONTEXT_KEY):
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
