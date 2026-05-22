from rest_framework import serializers

from plugins.polio.api.campaign_groups.serializers import CampaignNameSerializer
from plugins.polio.api.campaigns.serializers.campaigns import CampaignSerializer
from plugins.polio.api.campaigns.serializers.shared import CampaignTypeIdAndNameSerializer
from plugins.polio.models import (
    Campaign,
)
from plugins.polio.preparedness.spreadsheet_manager import (
    Campaign,
)


class IntegratedCampaignSerializer(serializers.ModelSerializer):
    campaign_types = CampaignTypeIdAndNameSerializer(many=True, read_only=True)

    class Meta:
        model = Campaign
        fields = ["id", "obr_name", "campaign_types"]


class RetrieveCampaignSerializer(CampaignSerializer):
    # Override Integrated campaigns fields to send obr_name to the front-end
    integrated_to = CampaignNameSerializer(read_only=True)
    integrated_campaigns = IntegratedCampaignSerializer(many=True, read_only=True)

    def validate(self, attrs):
        # Skip parent validation since this serializer doesn't handle write methods
        return serializers.ModelSerializer.validate(self, attrs)

    def validate_integrated_to(self, value):
        # Skip parent validation since this serializer doesn't handle write methods
        return value

    def validate_integrated_campaigns(self, value):
        # Skip parent validation since this serializer doesn't handle write methods
        return value
