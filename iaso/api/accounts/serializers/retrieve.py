from iaso.api.common import ModelSerializer
from iaso.models import Account, AccountFeatureFlag


class NestedAccountFeatureFlagSerializer(ModelSerializer):
    class Meta:
        model = AccountFeatureFlag
        fields = ["name", "code"]


class AccountRetrieveSerializer(ModelSerializer):
    feature_flags = NestedAccountFeatureFlagSerializer(
        many=True, read_only=True, required=False, allow_null=True, allow_empty=True
    )

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
            "feature_flags",
        ]
        read_only_fields = fields
