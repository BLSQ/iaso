from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import AccountFeatureFlag


class AccountFeatureFlagDropdownSerializer(ModelSerializer):
    label = serializers.CharField(read_only=True, source="name")
    value = serializers.CharField(read_only=True, source="code")

    class Meta:
        model = AccountFeatureFlag
        fields = ["label", "value"]
