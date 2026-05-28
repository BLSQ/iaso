from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Account, AccountFeatureFlag, Profile


class CreateUserSerializer(ModelSerializer):
    account_name = serializers.CharField(allow_blank=False, required=True, allow_null=False, write_only=True)
    feature_flags = serializers.SlugRelatedField(
        many=True,
        queryset=AccountFeatureFlag.objects.all(),
        slug_field="code",
        required=False,
        allow_null=True,
        allow_empty=True,
        write_only=True,
    )

    class Meta:
        model = get_user_model()
        fields = ["account_name", "username", "password", "is_superuser", "is_staff", "feature_flags"]
        extra_kwargs = {
            "account_name": {"write_only": True},
            "username": {"write_only": True},
            "password": {"write_only": True},
            "is_superuser": {"write_only": True},
            "is_staff": {"write_only": True},
            "feature_flags": {"write_only": True},
        }

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("password")
        account_name = validated_data.pop("account_name")
        feature_flags = validated_data.pop("feature_flags", [])

        instance = super().create(validated_data)
        instance.set_password(password)
        instance.save()

        # create related account
        account, _ = Account.objects.get_or_create(name=account_name)

        account.feature_flags.set(feature_flags)

        # create related profile
        Profile.objects.create(user=instance, account=account)

        return instance
