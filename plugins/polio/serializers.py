from django.db.models import fields
from rest_framework import serializers
from .models import Preparedness, Round, Campaign
from .preparedness.google_sheet import (
    open_sheet_by_url,
    get_regional_level_preparedness,
    get_national_level_preparedness,
    InvalidFormatError,
)
from gspread.exceptions import APIError


class RoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = "__all__"


class PreparednessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Preparedness
        exclude = ["campaign"]


class PreparednessPreviewSerializer(serializers.Serializer):
    google_sheet_url = serializers.URLField()

    def validate(self, attrs):
        try:
            sheet = open_sheet_by_url(attrs.get("google_sheet_url"))
            return {
                "national": get_national_level_preparedness(sheet),
                **get_regional_level_preparedness(sheet),
            }
        except InvalidFormatError as e:
            raise serializers.ValidationError(e.args[0])
        except APIError as e:
            raise serializers.ValidationError(e.args[0].get("message"))

    def to_representation(self, instance):
        return instance


class CampaignSerializer(serializers.ModelSerializer):
    round_one = RoundSerializer()
    round_two = RoundSerializer()
    preparedness_data = PreparednessSerializer(required=False)

    def create(self, validated_data):
        round_one_data = validated_data.pop("round_one")
        round_two_data = validated_data.pop("round_two")
        preparedness_data = validated_data.pop("preparedness_data", None)

        campaign = Campaign.objects.create(
            **validated_data,
            round_one=Round.objects.create(**round_one_data),
            round_two=Round.objects.create(**round_two_data)
        )

        if preparedness_data is not None:
            Preparedness.objects.create(campaign=campaign, **preparedness_data)
        return campaign

    def update(self, instance, validated_data):
        round_one_data = validated_data.pop("round_one")
        round_two_data = validated_data.pop("round_two")

        Round.objects.filter(pk=instance.round_one_id).update(**round_one_data)
        Round.objects.filter(pk=instance.round_two_id).update(**round_two_data)

        if "preparedness_data" in validated_data:
            Preparedness.objects.create(campaign=instance, **validated_data.pop("preparedness_data"))

        return super().update(instance, validated_data)

    class Meta:
        model = Campaign
        fields = "__all__"
        extra_kwargs = {"preparedness_data": {"write_only": True}}
