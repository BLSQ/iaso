import logging

from django.contrib.auth.models import Permission, User
from django.contrib.contenttypes.models import ContentType
from iaso.utils.module_permissions import account_module_permissions
from rest_framework import permissions, serializers
from rest_framework.mixins import CreateModelMixin
from rest_framework.viewsets import GenericViewSet

from hat.menupermissions.constants import MODULES
from hat.menupermissions.models import CustomPermissionSupport
from iaso.api.common import IsAdminOrSuperUser
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
    user_manual_path = serializers.CharField(required=False)
    modules = serializers.JSONField(required=True, initial=["DEFAULT"])  # type: ignore

    def validate_account_name(self, value):
        if Account.objects.filter(name=value).exists():
            raise serializers.ValidationError("account_name_already_exist")
        if DataSource.objects.filter(name=value).exists():
            raise serializers.ValidationError("data_source_name_already_exist")
        return value

    def validate_user_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("user_name_already_exist")
        return value

    def validate_modules(self, modules):
        if len(modules) == 0:
            raise serializers.ValidationError("modules_empty")
        else:
            module_codenames = [module["codename"] for module in MODULES]
            for module_codename in modules:
                if module_codename not in module_codenames:
                    raise serializers.ValidationError("module_not_exist")
        return modules

    def create(self, validated_data):
        data_source = DataSource.objects.create(name=validated_data["account_name"], description="via setup_account")
        source_version = SourceVersion.objects.create(data_source=data_source, number=1)

        user = User.objects.create_user(
            username=validated_data["user_username"],
            password=validated_data["password"],
            first_name=validated_data.get("user_first_name", ""),
            last_name=validated_data.get("user_last_name", ""),
        )

        module_codenames = [module["codename"] for module in MODULES]

        account_modules = []
        for module in validated_data.get("modules"):
            if module in module_codenames and module not in account_modules:
                account_modules.append(module)

        account = Account.objects.create(
            name=validated_data["account_name"],
            default_version=source_version,
            user_manual_path=validated_data.get("user_manual_path"),
            modules=account_modules,
        )

        # Create a setup_account project with an app_id represented by the account name
        app_id = validated_data["account_name"].replace(" ", ".").replace("-", ".")

        initial_project = Project.objects.create(
            name=validated_data["account_name"] + " project", account=account, app_id=app_id
        )

        # Create an initial orgUnit type and link it to project
        initial_orgunit_type = OrgUnitType.objects.create(name="Country", short_name="country", depth=1)
        initial_orgunit_type.projects.set([initial_project])
        initial_orgunit_type.save()

        # Link data source to projects and source version
        data_source.projects.set([initial_project])
        data_source.default_version = source_version
        data_source.save()

        Profile.objects.create(account=account, user=user)
        # Get all permissions linked to the modules
        modules_permissions = account_module_permissions(account_modules)

        permissions_to_add = filter(
            lambda permission_module: permission_module in modules_permissions,
            CustomPermissionSupport.get_full_permission_list(),
        )
        content_type = ContentType.objects.get_for_model(CustomPermissionSupport)
        user.user_permissions.set(Permission.objects.filter(codename__in=permissions_to_add, content_type=content_type))

        return validated_data


class SetupAccountViewSet(CreateModelMixin, GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSuperUser]
    serializer_class = SetupAccountSerializer
