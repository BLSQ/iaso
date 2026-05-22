import logging

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError as DjangoValidationError
from drf_spectacular.utils import extend_schema
from rest_framework import permissions
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.mixins import CreateModelMixin
from rest_framework.viewsets import GenericViewSet

from hat.audit.models import SETUP_ACCOUNT_API, Modification
from iaso.api.common import IsAdminOrSuperUser
from iaso.api.setup_account.serializers import SetupAccountSerializer
from iaso.models import Account, FeatureFlag


logger = logging.getLogger(__name__)


@extend_schema(tags=["Setup account"])
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
            "project_feature_flags": [FeatureFlag.REQUIRE_AUTHENTICATION, FeatureFlag.FORMS_AUTO_UPLOAD],
            "requesting_user": request.user.username if request.user else None,
            "requesting_user_id": request.user.id if request.user else None,
            "create_main_org_unit": request.data.get("create_main_org_unit", True),
            "create_demo_form": request.data.get("create_demo_form", True),
        }

        try:
            # Call the parent create method
            response = super().create(request, *args, **kwargs)

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

            if not isinstance(e, (DjangoValidationError, DRFValidationError)):
                logger.error(
                    f"Account setup failed: {audit_data['account_name']} by user {request.user.username if request.user else 'unknown'}: {str(e)}",
                    extra={"audit_data": audit_data, "exception": e},
                )

            # Re-raise the exception to maintain normal error handling
            raise

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
