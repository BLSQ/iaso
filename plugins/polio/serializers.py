from rest_framework import serializers
from .models import Round, Campaign
from .preparedness.google_sheet import get_national_level_preparedness_by_url, InvalidFormatError


class RoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = "__all__"


class PreparednessPreviewSerializer(serializers.Serializer):
    google_sheet_url = serializers.URLField()

    def validate(self, attrs):
        try:
            return get_national_level_preparedness_by_url(attrs.get("google_sheet_url"))
        except InvalidFormatError as e:
            raise serializers.ValidationError(e.args[0])

    def to_representation(self, instance):
        return {"national": instance}


class CampaignSerializer(serializers.ModelSerializer):
    round_one = RoundSerializer()
    round_two = RoundSerializer()

    def create(self, validated_data):
        round_one_data = validated_data.pop("round_one")
        round_two_data = validated_data.pop("round_two")

        return Campaign.objects.create(
            **validated_data,
            round_one=Round.objects.create(**round_one_data),
            round_two=Round.objects.create(**round_two_data)
        )

    def update(self, instance, validated_data):
        round_one_data = validated_data.pop("round_one")
        round_two_data = validated_data.pop("round_two")

        Round.objects.filter(pk=instance.round_one_id).update(**round_one_data)
        Round.objects.filter(pk=instance.round_two_id).update(**round_two_data)

        return super().update(instance, validated_data)

    class Meta:
        model = Campaign
        fields = "__all__"
