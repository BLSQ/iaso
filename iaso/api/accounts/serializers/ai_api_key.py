from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Account


class AccountRetrieveAIApiKeySerializer(serializers.Serializer):
    anthropic_api_key = serializers.SerializerMethodField()

    @extend_schema_field(serializers.CharField(allow_blank=True, allow_null=True, required=False))
    def get_anthropic_api_key(self, obj):
        if obj.anthropic_api_key:
            return f"{obj.anthropic_api_key[:8]}..."
        return None


class AccountUpdateAIApiKeySerializer(ModelSerializer):
    class Meta:
        model = Account
        fields = ["anthropic_api_key"]
        extra_kwargs = {
            "anthropic_api_key": {
                "write_only": True,
                "min_length": 16,
                "required": True,
                "allow_null": False,
                "allow_blank": False,
            }
        }
