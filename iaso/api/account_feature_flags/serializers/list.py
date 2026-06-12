from iaso.api.common import ModelSerializer
from iaso.models import AccountFeatureFlag


class AccountFeatureFlagListSerializer(ModelSerializer):
    class Meta:
        model = AccountFeatureFlag
        fields = ["name", "code", "created_at", "updated_at"]
