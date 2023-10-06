from django.utils.translation import gettext as _
from plugins.polio.api.rounds.reasons_for_delay import ReasonForDelayForCampaignSerializer
from rest_framework import serializers
from rest_framework.fields import Field

from iaso.api.common import UserSerializer
from iaso.models import Group
from plugins.polio.models import Destruction, ReasonForDelay, RoundDateHistoryEntry, RoundVaccine
from plugins.polio.preparedness.spreadsheet_manager import *

logger = getLogger(__name__)


class GroupSerializer(serializers.ModelSerializer):
    org_units = serializers.PrimaryKeyRelatedField(
        many=True, allow_empty=True, queryset=OrgUnit.objects.all(), style={"base_template": "input.html"}
    )
    name = serializers.CharField(default="hidden")

    class Meta:
        model = Group
        fields = ["name", "org_units", "id"]
        ref_name = "polio_group_serializer"


class DestructionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destruction
        fields = [
            "vials_destroyed",
            "date_report_received",
            "date_report",
            "comment",
            "id",
        ]


class OrgUnitSerializer(serializers.ModelSerializer):
    country_parent = serializers.SerializerMethodField()
    root = serializers.SerializerMethodField()  # type: ignore

    def __init__(self, *args, **kwargs):
        for field in kwargs.pop("hidden_fields", []):
            self.fields.pop(field)
        super().__init__(*args, **kwargs)

    def get_country_parent(self, instance: OrgUnit):
        countries = instance.country_ancestors()
        if countries is not None and len(countries) > 0:
            country = countries[0]
            return OrgUnitSerializer(instance=country, hidden_fields=["country_parent", "root"]).data

    def get_root(self, instance: OrgUnit):
        root = instance.root()
        return OrgUnitSerializer(instance=root, hidden_fields=["country_parent", "root"]).data if root else None

    class Meta:
        model = OrgUnit
        fields = ["id", "name", "root", "country_parent"]


class RoundVaccineSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundVaccine
        fields = ["wastage_ratio_forecast", "doses_per_vial", "name", "id"]


class RoundDateHistoryEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundDateHistoryEntry
        fields = [
            "created_at",
            "reason",
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
            "reason",
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
    reason_for_delay: Field = serializers.PrimaryKeyRelatedField(
        queryset=ReasonForDelay.objects.all(), many=False
    )  # filter by account

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
