from rest_framework import serializers

from plugins.polio.models import Campaign, CampaignGroup


class CampaignNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = ["id", "obr_name"]


class CampaignGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignGroup
        fields = "__all__"

    campaigns = CampaignNameSerializer(many=True, read_only=True)
    campaigns_ids = serializers.PrimaryKeyRelatedField(many=True, queryset=Campaign.objects.all(), source="campaigns")
