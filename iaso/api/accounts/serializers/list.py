from iaso.api.common import ModelSerializer
from iaso.models import Account


class AccountListSerializer(ModelSerializer):
    class Meta:
        model = Account
        fields = ["id", "name", "created_at", "updated_at"]
