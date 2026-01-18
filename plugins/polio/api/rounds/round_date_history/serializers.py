from rest_framework import serializers
from rest_framework.fields import Field

from iaso.api.common import UserSerializer
from plugins.polio.api.rounds.reasons_for_delay.serializers import (
    ReasonForDelayFieldSerializer,
    ReasonForDelayForCampaignSerializer,
)
from plugins.polio.models import RoundDateHistoryEntry
from plugins.polio.preparedness.spreadsheet_manager import *


class RoundDateHistoryEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundDateHistoryEntry
        fields = [
            "created_at",
            "reason_for_delay",
            "ended_at",
            "started_at",
            "round",
            "previous_ended_at",
            "previous_started_at",
            "modified_by",
        ]

    modified_by = UserSerializer(required=False, read_only=True)
    round: Field = serializers.PrimaryKeyRelatedField(read_only=True, many=False)
    reason_for_delay: Field = ReasonForDelayForCampaignSerializer(many=False)

    def validate(self, data):
        if not data.get("reason_for_delay", None):
            raise serializers.ValidationError("No reason provided")
        start_date = data["started_at"]
        end_date = data["ended_at"]
        start_date_changed = start_date != data["previous_started_at"]
        end_date_changed = start_date != data["previous_ended_at"]
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError("End date should be after start date")
        if not start_date_changed and not end_date_changed:
            raise serializers.ValidationError("No date was modified")
        return super().validate(data)


class RoundDateHistoryEntryForRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundDateHistoryEntry
        fields = [
            "created_at",
            "reason_for_delay",
            "ended_at",
            "started_at",
            "round",
            "previous_ended_at",
            "previous_started_at",
            "modified_by",
        ]

    modified_by = UserSerializer(required=False, read_only=True)
    round: Field = serializers.PrimaryKeyRelatedField(read_only=True, many=False)
    reason_for_delay = ReasonForDelayFieldSerializer()

    def validate(self, data):
        if data.get("reason_for_delay", None) is None:
            raise serializers.ValidationError("No reason provided")
        start_date = data["started_at"]
        end_date = data["ended_at"]
        start_date_changed = start_date != data["previous_started_at"]
        end_date_changed = start_date != data["previous_ended_at"]
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError("End date should be after start date")
        if not start_date_changed and not end_date_changed:
            raise serializers.ValidationError("No date was modified")
        return super().validate(data)
