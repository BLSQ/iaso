from iaso.api.common import ModelSerializer
from iaso.models import Account


class AccountRetrieveSerializer(ModelSerializer):
    class Meta:
        model = Account
        fields = [
            "id",
            "name",
            "created_at",
            "user_manual_path",
            "forum_path",
            "modules",
            "enforce_password_validation",
            "anthropic_api_key",
        ]
        read_only_fields = fields
