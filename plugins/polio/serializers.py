from rest_framework import serializers
from .models import Round, Campaign


class RoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = '__all__'


class CampaignSerializer(serializers.ModelSerializer):
    round_one = RoundSerializer()
    round_two = RoundSerializer()

    def create(self, validated_data):
        round_one_data = validated_data.pop('round_one')
        round_two_data = validated_data.pop('round_two')

        campaign = Campaign.objects.create(
            **validated_data,
            round_one=Round.objects.create(**round_one_data),
            round_two=Round.objects.create(**round_two_data)
        )

        return campaign

    class Meta:
        model = Campaign
        fields = '__all__'
