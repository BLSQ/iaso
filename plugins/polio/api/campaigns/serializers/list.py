from plugins.polio.api.campaigns.serializers.campaigns import CampaignSerializer
from plugins.polio.api.campaigns.serializers.shared import CampaignTypeSerializer
from plugins.polio.api.rounds.serializers import RoundSerializer
from plugins.polio.models import (
    Campaign,
    Round,
)
from plugins.polio.preparedness.spreadsheet_manager import (
    Campaign,
)


class ListCampaignSerializer(CampaignSerializer):
    """This serializer contains juste enough data for the List view in the web ui"""

    class NestedListRoundSerializer(RoundSerializer):
        class Meta:
            model = Round
            fields = [
                "id",
                "number",
                "started_at",
                "ended_at",
            ]

    rounds = NestedListRoundSerializer(many=True, required=False)

    campaign_types = CampaignTypeSerializer(many=True, required=False)

    class Meta:
        model = Campaign
        fields = [
            "id",
            "epid",
            "obr_name",
            "account",
            "cvdpv2_notified_at",
            "top_level_org_unit_name",
            "top_level_org_unit_id",
            "rounds",
            "general_status",
            "grouped_campaigns",
            "campaign_types",
            "is_test",
            "is_preventive",
            "on_hold",
            "is_planned",
        ]
        read_only_fields = fields
