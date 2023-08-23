import logging

from django.contrib.auth.models import User, Permission
from django.contrib.contenttypes.models import ContentType
from rest_framework import permissions, serializers
from rest_framework.mixins import CreateModelMixin
from rest_framework.viewsets import GenericViewSet

from hat.menupermissions.models import CustomPermissionSupport
from iaso.models import Account, DataSource, SourceVersion, Profile, Project, OrgUnitType

logger = logging.getLogger(__name__)


# noinspection PyMethodMayBeStatic
class SetupAccountSerializer(serializers.Serializer):
    """Set up an account with a first user and the appropriate sources"""

    account_name = serializers.CharField(required=True)
    user_username = serializers.CharField(max_length=150, required=True)
    user_first_name = serializers.CharField(max_length=30, required=False)
    user_last_name = serializers.CharField(max_length=150, required=False)
    password = serializers.CharField(required=True)

    def validate_account_name(self, value):
        if Account.objects.filter(name=value).exists():
            raise serializers.ValidationError("An account with this name already exists")
        if DataSource.objects.filter(name=value).exists():
            raise serializers.ValidationError("A data source with this name already exists")
        return value

    def validate_user_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A data source with this name already exists")
        return value

    def create(self, validated_data):
        data_source = DataSource.objects.create(name=validated_data["account_name"], description="via setup_account")
        source_version = SourceVersion.objects.create(data_source=data_source, number=1)

        user = User.objects.create_user(
            username=validated_data["user_username"],
            password=validated_data["password"],
            first_name=validated_data.get("user_first_name", ""),
            last_name=validated_data.get("user_last_name", ""),
        )
        account = Account.objects.create(name=validated_data["account_name"], default_version=source_version)

        # Create a setup_account project with an app_id represented by the account name
        initial_project = Project.objects.create(
            name=validated_data["account_name"] + " project", account=account, app_id=validated_data["account_name"]
        )

        # Create an initial orgUnit type and link it to project
        initial_orgunit_type = OrgUnitType.objects.create(name="COUNTRY", short_name="country", depth=1)
        initial_orgunit_type.projects.set([initial_project])
        initial_orgunit_type.save()

        # Link data source to projects and source version
        data_source.projects.set([initial_project])
        data_source.default_version = source_version
        data_source.save()

        Profile.objects.create(account=account, user=user)

        permissions_to_add = CustomPermissionSupport.get_full_permission_list()
        content_type = ContentType.objects.get_for_model(CustomPermissionSupport)
        user.user_permissions.set(Permission.objects.filter(codename__in=permissions_to_add, content_type=content_type))

        return validated_data


class SetupAccountViewSet(CreateModelMixin, GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    serializer_class = SetupAccountSerializer
