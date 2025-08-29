import logging

from django.contrib.auth.models import Permission, User
from django.core.files import File
from rest_framework import permissions, serializers
from rest_framework.mixins import CreateModelMixin
from rest_framework.viewsets import GenericViewSet

from hat.menupermissions.constants import DEFAULT_ACCOUNT_FEATURE_FLAGS, MODULES
from iaso.api.common import IsAdminOrSuperUser
from iaso.models import (
    Account,
    AccountFeatureFlag,
    DataSource,
    Form,
    FormVersion,
    OrgUnit,
    OrgUnitType,
    Profile,
    Project,
    SourceVersion,
)
from iaso.odk import parsing
from iaso.utils.module_permissions import account_module_permissions


logger = logging.getLogger(__name__)


# noinspection PyMethodMayBeStatic
class SetupAccountSerializer(serializers.Serializer):
    """Set up an account with a first user and the appropriate sources"""

    account_name = serializers.CharField(required=True)
    user_username = serializers.CharField(max_length=150, required=True)
    user_first_name = serializers.CharField(max_length=30, required=False)
    user_last_name = serializers.CharField(max_length=150, required=False)
    user_email = serializers.EmailField(required=False)
    password = serializers.CharField(required=True)
    user_manual_path = serializers.CharField(required=False)
    modules = serializers.JSONField(required=True, initial=["DEFAULT", "DATA_COLLECTION_FORMS"])  # type: ignore
    analytics_script = serializers.CharField(required=False)
    feature_flags = serializers.JSONField(
        required=False, default=DEFAULT_ACCOUNT_FEATURE_FLAGS, initial=DEFAULT_ACCOUNT_FEATURE_FLAGS
    )

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

    def validate_user_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("user_email_already_exist")
        return value

    def validate_modules(self, modules):
        if len(modules) == 0:
            raise serializers.ValidationError("modules_empty")
        module_codenames = [module["codename"] for module in MODULES]
        for module_codename in modules:
            if module_codename not in module_codenames:
                raise serializers.ValidationError("module_not_exist")
        return modules

    def validate_feature_flags(self, feature_flags):
        if not feature_flags or len(feature_flags) == 0:
            raise serializers.ValidationError("feature_flags_empty")
        default_account_feature_flags = AccountFeatureFlag.objects.all()
        account_feature_flags = [feature_flag.code for feature_flag in default_account_feature_flags]
        for feature_flag in feature_flags:
            if feature_flag not in account_feature_flags:
                raise serializers.ValidationError("invalid_account_feature_flag")
        return feature_flags

    def create(self, validated_data):
        data_source = DataSource.objects.create(name=validated_data["account_name"], description="via setup_account")
        source_version = SourceVersion.objects.create(data_source=data_source, number=1)

        user = User.objects.create_user(
            username=validated_data["user_username"],
            password=validated_data["password"],
            first_name=validated_data.get("user_first_name", ""),
            last_name=validated_data.get("user_last_name", ""),
            email=validated_data.get("user_email", ""),
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
            analytics_script=validated_data.get("analytics_script", ""),
        )
        account.feature_flags.set(validated_data.get("feature_flags"))

        # Create a setup_account project with an app_id represented by the account name
        app_id = validated_data["account_name"].replace(" ", ".").replace("-", ".")

        initial_project = Project.objects.create(name="Main Project", account=account, app_id=app_id)

        # Link data source to projects and source version
        data_source.projects.set([initial_project])
        data_source.default_version = source_version
        data_source.save()

        # Create a main org unit type for immediate use
        main_org_unit_type = OrgUnitType.objects.create(
            name="Main org unit type",
            short_name="Main ou type",
            depth=0,
        )
        main_org_unit_type.projects.set([initial_project])

        # Create a main org unit using the created type
        OrgUnit.objects.create(
            name="Main org unit",
            org_unit_type=main_org_unit_type,
            version=source_version,
            validation_status=OrgUnit.VALIDATION_VALID,
        )

        # Create a demo form using the demo form file
        demo_form = Form.objects.create(
            name="Demo Form",
            form_id="demo_form",
            location_field="gps",
        )
        demo_form.org_unit_types.add(main_org_unit_type)
        demo_form.projects.add(initial_project)

        # Create the first version of the form using the demo form file
        with open("setuper/data/demo_form.xlsx", "rb") as demo_form_file:
            survey = parsing.parse_xls_form(demo_form_file)
            demo_form_file.seek(0)  # Reset file pointer to beginning
            FormVersion.objects.create_for_form_and_survey(form=demo_form, survey=survey, xls_file=File(demo_form_file))

        profile = Profile.objects.create(account=account, user=user)
        profile.projects.add(initial_project)

        # Get all permissions linked to the modules
        modules_permissions = account_module_permissions(account_modules)

        user.user_permissions.set(Permission.objects.filter(codename__in=modules_permissions))
        return validated_data


class SetupAccountViewSet(CreateModelMixin, GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSuperUser]
    serializer_class = SetupAccountSerializer
