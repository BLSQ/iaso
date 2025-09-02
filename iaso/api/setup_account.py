import logging

from django.contrib.auth.models import Permission, User
from django.contrib.contenttypes.models import ContentType
from django.core.files import File
from django.utils.translation import gettext as _
from rest_framework import permissions, serializers
from rest_framework.mixins import CreateModelMixin
from rest_framework.viewsets import GenericViewSet

from hat.audit.models import SETUP_ACCOUNT_API, Modification
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
from iaso.utils import parse_json_field
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
    password = serializers.CharField(required=False)
    user_manual_path = serializers.CharField(required=False)
    email_invitation = serializers.BooleanField(required=False, default=False)
    language = serializers.ChoiceField(
        choices=settings.LANGUAGES
        required=False,
        default="en",
        help_text="Language for the user interface and email invitations",
    )
    modules = serializers.JSONField(required=True, initial=["DEFAULT", "DATA_COLLECTION_FORMS"])  # type: ignore
    analytics_script = serializers.CharField(required=False)
    feature_flags = serializers.JSONField(
        required=False, default=DEFAULT_ACCOUNT_FEATURE_FLAGS, initial=DEFAULT_ACCOUNT_FEATURE_FLAGS
    )
    created_account_id = serializers.IntegerField(read_only=True)

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

    def validate(self, data):
        password = data.get("password", "")
        email_invitation = data.get("email_invitation", False)
        user_email = data.get("user_email", "")

        # If email invitation is True, email is required
        if email_invitation and not user_email:
            raise serializers.ValidationError({"user_email": _("Email is required when email_invitation is True")})

        # If email invitation is False, password is required
        if not email_invitation and not password:
            raise serializers.ValidationError({"password": _("Password is required when email_invitation is False")})

        return data

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

        # Create user with or without password based on email invitation
        email_invitation = validated_data.get("email_invitation", False)
        password = validated_data.get("password", "")

        if email_invitation and not password:
            # Create user without password when sending email invitation only
            user = User.objects.create_user(
                username=validated_data["user_username"],
                password=None,  # Will be set later via email invitation
                first_name=validated_data.get("user_first_name", ""),
                last_name=validated_data.get("user_last_name", ""),
                email=validated_data.get("user_email", ""),
            )
            user.set_unusable_password()
            user.save()
        else:
            # Create user with password (either password only or password + email invitation)
            user = User.objects.create_user(
                username=validated_data["user_username"],
                password=password,
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

        # Get language from validated data, defaulting to English
        language = validated_data.get("language", "en")

        profile = Profile.objects.create(account=account, user=user, language=language)
        profile.projects.add(initial_project)

        # Get all permissions linked to the modules
        modules_permissions = account_module_permissions(account_modules)

        user.user_permissions.set(Permission.objects.filter(codename__in=modules_permissions))

        # Send email invitation if requested
        if email_invitation and user.email:
            from iaso.api.profiles.profiles import ProfilesViewSet

            profile_viewset = ProfilesViewSet()
            profile_viewset.request = self.context.get("request")

            # Get the profile for the user
            profile = Profile.objects.get(user=user, account=account)

            # Send email invitation using existing logic with profile language
            profile_viewset.send_email_invitation(
                profile=profile,
                email_subject=profile_viewset.get_subject_by_language(profile_viewset, profile.language),
                email_message=profile_viewset.get_message_by_language(profile_viewset, profile.language),
                email_html_message=profile_viewset.get_html_message_by_language(profile_viewset, profile.language),
            )

        validated_data["created_account_id"] = account.id
        return validated_data


class SetupAccountViewSet(CreateModelMixin, GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSuperUser]
    serializer_class = SetupAccountSerializer

    def create(self, request, *args, **kwargs):
        # Prepare audit data for logging
        audit_data = {
            "account_name": request.data.get("account_name", ""),
            "user_username": request.data.get("user_username", ""),
            "user_first_name": request.data.get("user_first_name", ""),
            "user_last_name": request.data.get("user_last_name", ""),
            "user_email": request.data.get("user_email", ""),
            "email_invitation": request.data.get("email_invitation", False),
            "language": request.data.get("language", "en"),
            "modules": request.data.get("modules", []),
            "feature_flags": request.data.get("feature_flags", []),
            "requesting_user": request.user.username if request.user else None,
            "requesting_user_id": request.user.id if request.user else None,
        }

        # Parse JSON fields that might come as strings
        parse_json_field(audit_data, "modules", [])
        parse_json_field(audit_data, "feature_flags", [])

        try:
            # Call the parent create method
            response = super().create(request, *args, **kwargs)

            # Log successful account creation
            audit_data.update(
                {
                    "status": "success",
                    "created_account_id": response.data["created_account_id"],
                }
            )

            # Create audit log for successful operation
            # Use Account content type since we're creating an account
            account_content_type = ContentType.objects.get_for_model(Account)
            Modification.objects.create(
                user=request.user,
                content_type=account_content_type,
                object_id=response.data["created_account_id"],
                past_value=[],
                new_value=[audit_data],
                source=SETUP_ACCOUNT_API,
            )

            logger.info(
                f"Account setup completed successfully: {audit_data['account_name']} by user {request.user.username if request.user else 'unknown'}",
                extra={"audit_data": audit_data},
            )

            return response

        except Exception as e:
            # Log failed account creation
            audit_data.update(
                {
                    "status": "error",
                    "error_message": str(e),
                    "error_type": type(e).__name__,
                }
            )

            # Create audit log for failed operation
            # Use Account content type since we're trying to create an account
            account_content_type = ContentType.objects.get_for_model(Account)
            Modification.objects.create(
                user=request.user,
                content_type=account_content_type,
                object_id="0",  # Use 0 as placeholder since no account was created
                past_value=[],
                new_value=[audit_data],
                source=SETUP_ACCOUNT_API,
            )

            logger.error(
                f"Account setup failed: {audit_data['account_name']} by user {request.user.username if request.user else 'unknown'}: {str(e)}",
                extra={"audit_data": audit_data, "exception": e},
            )

            # Re-raise the exception to maintain normal error handling
            raise
