from rest_framework import serializers
from .models import Round, Campaign


class RoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = '__all__'


class CampaignSerializer(serializers.ModelSerializer):
    round_one = RoundSerializer()
    round_two = RoundSerializer()

    class Meta:
        model = Campaign
        fields = '__all__'
