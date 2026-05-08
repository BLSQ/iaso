from rest_framework import serializers

from plugins.polio.api.vaccines.permissions import has_vaccine_stock_edit_access
from plugins.polio.api.vaccines.stock_management.campaign import compute_category_from_campaign
from plugins.polio.models import Campaign, EarmarkedStock
from plugins.polio.permissions import (
    POLIO_VACCINE_STOCK_EARMARKS_ADMIN_PERMISSION,
    POLIO_VACCINE_STOCK_EARMARKS_NONADMIN_PERMISSION,
    POLIO_VACCINE_STOCK_EARMARKS_READ_ONLY_PERMISSION,
)


class EarmarkedStockSerializer(serializers.ModelSerializer):
    campaign = serializers.SerializerMethodField()
    round_number = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    campaign_category = serializers.SerializerMethodField()

    class Meta:
        model = EarmarkedStock
        fields = [
            "id",
            "vaccine_stock",
            "campaign",
            "temporary_campaign_name",
            "round_number",
            "form_a",
            "earmarked_stock_type",
            "vials_earmarked",
            "doses_earmarked",
            "comment",
            "created_at",
            "updated_at",
            "can_edit",
            "campaign_category",
            "doses_per_vial",
        ]

    def get_can_edit(self, obj):
        return has_vaccine_stock_edit_access(
            self.context["request"].user,
            obj.created_at,
            admin_perm=POLIO_VACCINE_STOCK_EARMARKS_ADMIN_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_EARMARKS_NONADMIN_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_EARMARKS_READ_ONLY_PERMISSION,
        )

    def get_campaign_category(self, obj):
        return compute_category_from_campaign(obj.campaign, obj.round)

    def get_campaign(self, obj):
        return obj.campaign.obr_name if obj.campaign else None

    def get_round_number(self, obj):
        return obj.round.number if obj.round else None

    def create(self, validated_data):
        campaign = None
        round_obj = None

        campaign_data = self.initial_data.get("campaign", None)
        round_number = self.initial_data.get("round_number", None)

        if campaign_data:
            campaign = Campaign.objects.get(
                obr_name=campaign_data,
                account=self.context["request"].user.iaso_profile.account,
            )
            if round_number:
                round_obj = campaign.rounds.get(number=round_number)

        validated_data["campaign"] = campaign
        validated_data["round"] = round_obj

        return super().create(validated_data)

    def update(self, instance, validated_data):
        campaign = None
        round_obj = None

        campaign_data = self.initial_data.get("campaign", None)
        round_number = self.initial_data.get("round_number", None)

        if campaign_data:
            campaign = Campaign.objects.get(
                obr_name=campaign_data,
                account=self.context["request"].user.iaso_profile.account,
            )
            if round_number:
                round_obj = campaign.rounds.get(number=round_number)

        validated_data["campaign"] = campaign
        validated_data["round"] = round_obj

        return super().update(instance, validated_data)
