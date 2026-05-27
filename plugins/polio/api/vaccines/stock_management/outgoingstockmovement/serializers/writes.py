from plugins.polio.models import Campaign


class OutgoingStockMovementWriteMixin:
    def extract_campaign_data(self, validated_data):
        campaign_data = validated_data.pop("campaign", None)
        if campaign_data:
            campaign_obr_name = campaign_data.get("obr_name")
            campaign = Campaign.objects.get(
                obr_name=campaign_obr_name,
                account=self.context["request"].user.iaso_profile.account,
            )
            return campaign
        return None

    def create(self, validated_data):
        campaign = self.extract_campaign_data(validated_data)
        if campaign:
            validated_data["campaign"] = campaign
        self.scan_file_if_exists(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        campaign = self.extract_campaign_data(validated_data)
        if campaign:
            instance.campaign = campaign
        self.scan_file_if_exists(validated_data, instance)
        return super().update(instance, validated_data)
