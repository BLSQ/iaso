from django.utils import timezone
from django.utils.translation import gettext as _
from rest_framework import serializers

from iaso.models import Group
from plugins.polio.api.campaigns.serializers.shared import CampaignScopeSerializer, CampaignTypeSerializer
from plugins.polio.api.rounds.serializers import RoundScopeSerializer, RoundSerializer
from plugins.polio.api.shared_serializers import GroupSerializer
from plugins.polio.models import (
    Campaign,
    CampaignScope,
    Round,
    RoundScope,
)
from plugins.polio.models.base import SubActivity, SubActivityScope
from plugins.polio.preparedness.spreadsheet_manager import (
    Campaign,
)


class GroupIdSerializer(GroupSerializer):
    class Meta:
        model = Group
        fields = ["id"]


class SubactivityScopeSerializer(serializers.ModelSerializer):
    group = GroupIdSerializer()

    class Meta:
        model = SubActivityScope
        fields = ["group", "vaccine"]


class SubactivitySerializer(serializers.ModelSerializer):
    scopes = SubactivityScopeSerializer(many=True)
    round_number = serializers.IntegerField(source="round.number")

    class Meta:
        model = SubActivity
        fields = ["name", "start_date", "end_date", "scopes", "id", "vaccine_names", "round_number"]


class RoundScopeSerializer(serializers.ModelSerializer):
    group = GroupIdSerializer()

    class Meta:
        model = RoundScope
        fields = ["group", "vaccine"]


class ListRoundSerializer(RoundSerializer):
    vaccine_names = serializers.CharField(read_only=True)
    scopes = RoundScopeSerializer(many=True, required=False)

    class Meta:
        model = Round
        fields = [
            "id",
            "number",
            "started_at",
            "ended_at",
            "scopes",
            "vaccine_names",
            "target_population",
            "is_planned",
        ]

    def to_representation(self, instance):
        # Skip rounds on hold
        if instance.on_hold:
            return None
        return super().to_representation(instance)


class CampaignScopeSerializer(serializers.ModelSerializer):
    group = GroupIdSerializer()

    class Meta:
        model = CampaignScope
        fields = ["group", "vaccine"]


class CalendarCampaignSerializerV2(serializers.ModelSerializer):
    """This serializer contains juste enough data for the Calendar view in the web ui. Read only.
    Used by both anonymous and non-anonymous user"""

    rounds = ListRoundSerializer(many=True, required=False)
    scopes = CampaignScopeSerializer(many=True, required=False)
    campaign_types = CampaignTypeSerializer(many=True, required=False)
    sub_activities = serializers.SerializerMethodField()
    top_level_org_unit_name = serializers.SlugRelatedField(source="country", slug_field="name", read_only=True)
    top_level_org_unit_id = serializers.SlugRelatedField(source="country", slug_field="id", read_only=True)
    general_status = serializers.SerializerMethodField()
    vaccines = serializers.SerializerMethodField(read_only=True)
    first_round_started_at = serializers.DateField(read_only=True)

    def get_sub_activities(self, campaign):
        sub_activities = SubActivity.objects.filter(round__campaign=campaign)
        return SubactivitySerializer(sub_activities, many=True, context=self.context).data

    def get_general_status(self, campaign):
        now_utc = timezone.now().date()
        ordered_rounds = list(campaign.rounds.all())
        ordered_rounds.sort(key=lambda x: x.number, reverse=True)
        for round in ordered_rounds:
            if round.ended_at and now_utc > round.ended_at:
                return _("Round {} ended").format(round.number)
            if round.started_at and now_utc >= round.started_at:
                return _("Round {} started").format(round.number)
        return _("Preparing")

    def get_vaccines(self, obj):
        if obj.vaccines_extended_list:
            return ",".join(obj.vaccines_extended_list)
        return ""

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Filter out None values from rounds (the test rounds we skipped)
        data["rounds"] = [r for r in data["rounds"] if r is not None]
        return data

    class Meta:
        model = Campaign
        fields = [
            "id",
            "epid",
            "obr_name",
            "account",
            "top_level_org_unit_name",
            "top_level_org_unit_id",
            "rounds",
            "sub_activities",
            "is_preventive",
            "general_status",
            "grouped_campaigns",
            "separate_scopes_per_round",
            "scopes",
            "campaign_types",
            "description",
            "is_test",
            "on_hold",
            "is_planned",
            "vaccines",
            "integrated_to",
            "first_round_started_at",
        ]
        read_only_fields = fields
