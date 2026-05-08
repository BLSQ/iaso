from plugins.polio.models import Campaign, OutgoingStockMovement


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
        next_status = validated_data.get("status", instance.status)
        is_received_to_temporary = (
            instance.status == OutgoingStockMovement.StatusChoices.RECEIVED
            and next_status == OutgoingStockMovement.StatusChoices.TEMPORARY
        )
        if is_received_to_temporary:
            if instance.file:
                instance.file.delete(save=False)
            validated_data["file"] = None
            validated_data["form_a_reception_date"] = None
        else:
            self.scan_file_if_exists(validated_data, instance)
        return super().update(instance, validated_data)
