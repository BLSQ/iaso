from iaso.api.common import ModelSerializer
from iaso.models import Account


class AccountUpdateSerializer(ModelSerializer):
    class Meta:
        model = Account
        fields = [
            "name",
            "user_manual_path",
            "forum_path",
            "modules",
            "enforce_password_validation",
            "anthropic_api_key",
            "custom_translations",
        ]
        extra_kwargs = {
            "name": {"write_only": True},
            "user_manual_path": {"write_only": True},
            "forum_path": {"write_only": True},
            "modules": {"write_only": True},
            "enforce_password_validation": {"write_only": True},
            "anthropic_api_key": {"write_only": True},
            "custom_translations": {"write_only": True},
        }
