from rest_framework import serializers

from plugins.polio.api.shared_serializers import GroupSerializer
from plugins.polio.models import (
    Campaign,
    CampaignScope,
    CampaignType,
)
from plugins.polio.preparedness.spreadsheet_manager import (
    Campaign,
)


class CampaignScopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignScope
        fields = ["group", "vaccine"]

    group = GroupSerializer()


class CampaignTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignType
        fields = ["id", "name", "slug"]


class CampaignTypeIdAndNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignType
        fields = ["id", "name"]


class CampaignDropDownSerializer(serializers.ModelSerializer):
    obr_name = serializers.CharField()
    id = serializers.CharField()
    campaign_types = CampaignTypeIdAndNameSerializer(many=True, read_only=True)

    class Meta:
        model = Campaign
        fields = ["id", "obr_name", "campaign_types"]
