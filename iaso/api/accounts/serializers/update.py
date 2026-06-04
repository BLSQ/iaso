from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Account, AccountFeatureFlag


class AccountUpdateSerializer(ModelSerializer):
    feature_flags = serializers.SlugRelatedField(
        queryset=AccountFeatureFlag.objects.all(),
        slug_field="code",
        many=True,
        allow_empty=True,
        allow_null=True,
        required=False,
        write_only=True,
    )

    class Meta:
        model = Account
        fields = [
            "name",
            "user_manual_path",
            "forum_path",
            "modules",
            "enforce_password_validation",
            "custom_translations",
            "feature_flags",
        ]
        extra_kwargs = {
            "name": {"write_only": True},
            "user_manual_path": {"write_only": True},
            "forum_path": {"write_only": True},
            "modules": {"write_only": True},
            "enforce_password_validation": {"write_only": True},
            "custom_translations": {"write_only": True},
        }
