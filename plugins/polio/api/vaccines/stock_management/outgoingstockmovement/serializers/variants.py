from rest_framework import serializers

from .base import OutgoingStockMovementSerializer


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
