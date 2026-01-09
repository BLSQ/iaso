from rest_framework import serializers

from iaso.models import Group
from plugins.polio.api.campaigns.serializers.campaigns import CampaignSerializer
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


class CalendarCampaignSerializer(CampaignSerializer):
    """This serializer contains juste enough data for the Calendar view in the web ui. Read only.
    Used by both anonymous and non-anonymous user"""

    class NestedSubactivitySerializer(serializers.ModelSerializer):
        class NestedScopeSerializer(serializers.ModelSerializer):
            class NestedGroupSerializer(GroupSerializer):
                class Meta:
                    model = Group
                    fields = ["id"]

            class Meta:
                model = SubActivityScope
                fields = ["group", "vaccine"]

            group = NestedGroupSerializer()

        scopes = NestedScopeSerializer(many=True)
        round_number = serializers.IntegerField(source="round.number")

        class Meta:
            model = SubActivity
            fields = ["name", "start_date", "end_date", "scopes", "id", "vaccine_names", "round_number"]

    class NestedListRoundSerializer(RoundSerializer):
        class NestedScopeSerializer(RoundScopeSerializer):
            class NestedGroupSerializer(GroupSerializer):
                class Meta:
                    model = Group
                    fields = ["id"]

            class Meta:
                model = RoundScope
                fields = ["group", "vaccine"]

            group = NestedGroupSerializer()

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

    class NestedScopeSerializer(CampaignScopeSerializer):
        class NestedGroupSerializer(GroupSerializer):
            class Meta:
                model = Group
                fields = ["id"]

        class Meta:
            model = CampaignScope
            fields = ["group", "vaccine"]

        group = NestedGroupSerializer()

    rounds = NestedListRoundSerializer(many=True, required=False)
    scopes = NestedScopeSerializer(many=True, required=False)
    campaign_types = CampaignTypeSerializer(many=True, required=False)
    sub_activities = serializers.SerializerMethodField()

    def get_sub_activities(self, campaign):
        sub_activities = SubActivity.objects.filter(round__campaign=campaign)
        return self.NestedSubactivitySerializer(sub_activities, many=True, context=self.context).data

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
            # displayed in RoundPopper
            # To deprecate in front-end code as it doesn't have subactivities
            "vaccines",
            "single_vaccines",
            "campaign_types",
            "description",
            "is_test",
            "on_hold",
            "is_planned",
        ]
        read_only_fields = fields
