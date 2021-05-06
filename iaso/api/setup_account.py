from django.contrib.auth.models import User
from rest_framework import permissions, serializers
import logging

from rest_framework.mixins import CreateModelMixin
from rest_framework.viewsets import GenericViewSet

from iaso.models import Account, DataSource, SourceVersion, Profile

logger = logging.getLogger(__name__)


# noinspection PyMethodMayBeStatic
class SetupAccountSerializer(serializers.Serializer):
    """Setup an account with a first user and the appropriate sources"""

    account_name = serializers.CharField(required=True)
    user_username = serializers.CharField(max_length=150, required=True)
    user_first_name = serializers.CharField(max_length=30, required=False)
    user_last_name = serializers.CharField(max_length=150, required=False)
    password = serializers.CharField(required=True)

    def validate_account_name(self, value):
        if Account.objects.filter(name=value).exists():
            raise serializers.ValidationError(
                "An account with this name already exists"
            )
        if DataSource.objects.filter(name=value).exists():
            raise serializers.ValidationError(
                "A data source with this name already exists"
            )
        return value

    def validate_user_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "A data source with this name already exists"
            )
        return value

    def save(self):
        assert hasattr(
            self, "_errors"
        ), "You must call `.is_valid()` before calling `.save()`."

        assert (
            not self.errors
        ), "You cannot call `.save()` on a serializer with invalid data."
        validated_data = self.validated_data

        data_source = DataSource.objects.create(
            name=validated_data["account_name"], description="via setup_account"
        )
        source_version = SourceVersion.objects.create(data_source=data_source, number=1)
        data_source.default_version = source_version
        data_source.save()
        user = User.objects.create_user(
            username=validated_data["user_username"],
            password=validated_data["password"],
            first_name=validated_data.get("user_first_name", ""),
            last_name=validated_data.get("user_last_name", ""),
        )
        account = Account.objects.create(
            name=validated_data["account_name"], default_version=source_version
        )
        account.users.add(user)
        profile = Profile.objects.create(account=account, user=user)
        return validated_data


class SetupAccountViewSet(CreateModelMixin, GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    serializer_class = SetupAccountSerializer
