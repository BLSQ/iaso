from django.contrib.auth import get_user_model, login
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.filters import OrderingFilter
from rest_framework.mixins import RetrieveModelMixin, UpdateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_204_NO_CONTENT
from rest_framework.viewsets import GenericViewSet

from iaso.api.accounts.pagination import AccountPagination
from iaso.api.accounts.serializers.ai_api_key import AccountRetrieveAIApiKeySerializer, AccountUpdateAIApiKeySerializer
from iaso.api.accounts.serializers.custom_translations import AccountCustomTranslationsSerializer
from iaso.api.accounts.serializers.list import AccountListSerializer
from iaso.api.accounts.serializers.retrieve import AccountRetrieveSerializer
from iaso.api.accounts.serializers.retrieve_current import AccountRetrieveCurrentSerializer
from iaso.api.accounts.serializers.set_default_version import AccountSetDefaultVersionSerializer
from iaso.api.accounts.serializers.switch import AccountSwitchSerializer
from iaso.api.accounts.serializers.update import AccountUpdateSerializer
from iaso.api.common import HasPermission
from iaso.api.common.mixin import CustomPaginationListModelMixin
from iaso.api.common.permissions import HasModulePermission
from iaso.models import Account
from iaso.modules import MODULE_FORM_AI
from iaso.permissions.core_permissions import CORE_ACCOUNT_MANAGEMENT_PERMISSION, CORE_SOURCE_PERMISSION


@extend_schema(tags=["Account"])
class AccountViewSet(CustomPaginationListModelMixin, RetrieveModelMixin, UpdateModelMixin, GenericViewSet):
    http_method_names = ["get", "options", "patch", "put", "head", "trace", "post", "delete"]
    pagination_class = AccountPagination
    filter_backends = [OrderingFilter]
    ordering = ["id"]

    @property
    def permission_classes(self):
        if self.action == "set_default_version":
            return [
                IsAuthenticated,
                HasPermission(CORE_SOURCE_PERMISSION),
            ]
        if self.action in ["switch", "me"]:
            return [IsAuthenticated]
        if self.action in ["ai_api_key", "update_ai_api_key", "delete_ai_api_key"]:
            return [
                IsAuthenticated,
                HasPermission(CORE_ACCOUNT_MANAGEMENT_PERMISSION),
                HasModulePermission(MODULE_FORM_AI),
            ]
        return [IsAuthenticated, HasPermission(CORE_ACCOUNT_MANAGEMENT_PERMISSION)]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return AccountRetrieveSerializer
        if self.action == "list":
            return AccountListSerializer
        if self.action in ["update", "partial_update"]:
            return AccountUpdateSerializer
        if self.action == "switch":
            return AccountSwitchSerializer
        if self.action == "set_default_version":
            return AccountSetDefaultVersionSerializer
        if self.action == "custom_translations":
            return AccountCustomTranslationsSerializer
        if self.action == "me":
            return AccountRetrieveCurrentSerializer
        if self.action == "ai_api_key":
            return AccountRetrieveAIApiKeySerializer
        if self.action == "update_ai_api_key":
            return AccountUpdateAIApiKeySerializer
        raise NotImplementedError(f"Serializer not implemented for {self.action}")

    def get_queryset(self):
        if not getattr(self.request, "user", None):
            return Account.objects.none()

        qs = Account.objects.filter_for_user(self.request.user).distinct()
        if self.action == "list":
            qs = qs.only("id", "name", "created_at", "updated_at")
        if self.action == "custom_translations":
            qs = qs.only("custom_translations")
        if self.action == "switch":
            qs = qs.only("id")
        if self.action == "retrieve":
            qs = qs.prefetch_related("feature_flags").only(
                "id", "name", "created_at", "user_manual_path", "forum_path", "modules", "enforce_password_validation"
            )
        if self.action == "ai_api_key":
            qs = qs.only("id", "anthropic_api_key")
        if self.action in ["update_ai_api_key", "delete_ai_api_key"]:
            qs = qs.only("id")
        if self.action == "me":
            qs = qs.select_related(
                "default_version", "default_version__data_source", "default_version__data_source__credentials"
            ).prefetch_related("feature_flags")
        return qs

    @extend_schema(responses={204: None})
    def update(self, request, *args, **kwargs):
        super().update(request, *args, **kwargs)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["GET"], url_path="custom-translations")
    def custom_translations(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @extend_schema(responses={204: None})
    @action(detail=False, methods=["POST"], url_path="switch")
    def switch(self, request):
        serializer = self.get_serializer(data=request.data, account_id_qs=self.get_queryset())
        serializer.is_valid(raise_exception=True)
        account = serializer.validated_data["account_id"]

        current_user = request.user

        if not getattr(current_user, "tenant_user", None):
            return Response(status=status.HTTP_404_NOT_FOUND)

        user_to_login = (
            get_user_model()
            .objects.filter(
                iaso_profile__account=account,
                tenant_user__main_user=current_user.tenant_user.main_user,
            )
            .exclude(pk=current_user.pk)
            .first()
        )

        if not user_to_login:
            return Response(status=status.HTTP_404_NOT_FOUND)

        user_to_login.backend = "iaso.auth.backends.MultiTenantAuthBackend"
        login(request, user_to_login)

        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(responses={204: None})
    @action(detail=True, methods=["PUT", "PATCH"], url_path="set-default-version")
    def set_default_version(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(responses={200: AccountRetrieveCurrentSerializer})
    @action(detail=False, methods=["GET"], url_path="me")
    def me(self, request):
        if not request.user and not request.user.iaso_profile and not request.user.iaso_profile.account:
            raise NotFound

        qs = list(self.get_queryset())

        other_account_qs = [a for a in qs if a.id != request.user.iaso_profile.account_id]
        instance = next(iter([a for a in qs if a.id == request.user.iaso_profile.account_id]), None)
        if not instance:
            raise NotFound

        serializer = self.get_serializer(instance=instance, other_account_qs=other_account_qs)
        return Response(serializer.data)

    @action(detail=True, methods=["GET"], url_path="ai-api-key")
    def ai_api_key(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @extend_schema(responses={204: None})
    @ai_api_key.mapping.put
    def update_ai_api_key(self, request, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(responses={204: None})
    @ai_api_key.mapping.delete
    def delete_ai_api_key(self, request, **kwargs):
        instance = self.get_object()
        instance.anthropic_api_key = None
        instance.save()
        return Response(status=HTTP_204_NO_CONTENT)
