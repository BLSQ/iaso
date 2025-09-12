"""This api is only there so the default version on an account can be modified"""

from django.contrib.auth import login
from rest_framework import permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response

import iaso.permissions as core_permissions

from iaso.models import Account, SourceVersion

from .common import HasPermission, ModelViewSet


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account

        fields = [
            "id",
            "default_version",
        ]

    def update(self, account, validated_data):
        default_version = validated_data.pop("default_version", None)
        user = self.context["request"].user
        if default_version is not None:
            source_version = get_object_or_404(
                SourceVersion,
                id=default_version.id,
                number=default_version.number,
            )
            projects = source_version.data_source.projects.all()
            for p in projects:
                if user.iaso_profile.account != p.account:
                    raise serializers.ValidationError({"Error": "Account not allowed to access this default_source"})
            account.default_version = source_version
            account.save()

        return account


class HasAccountPermission(permissions.BasePermission):
    def has_object_permission(self, request: Request, view, obj: Account):
        if request.user.is_authenticated:
            return request.user.iaso_profile.account == obj
        return False


class AccountViewSet(ModelViewSet):
    f"""Account API

    This API is restricted to authenticated users having the "{core_permissions.SOURCES}" permission
    Only allow to update default source / version for an account
    PUT /api/account/<id>
    """

    serializer_class = AccountSerializer
    results_key = "accounts"
    queryset = Account.objects.all()
    # FIXME: USe a PATCH in the future, it make more sense regarding HTTP method semantic
    http_method_names = ["patch", "put"]

    def get_permissions(self):
        if self.action == "switch":
            permission_classes = [permissions.IsAuthenticated, HasAccountPermission]
        else:
            permission_classes = [
                permissions.IsAuthenticated,
                HasPermission(core_permissions.SOURCES),  # type: ignore
                HasAccountPermission,
            ]

        return [permission() for permission in permission_classes]

    @action(detail=False, methods=["patch"], url_path="switch")
    def switch(self, request):
        # TODO: Make sure the account_id is present
        self.permission_classes = [permissions.IsAuthenticated, HasAccountPermission]
        self.check_permissions(request)
        account_id = int(request.data["account_id"]) if request.data.get("account_id") else None

        current_user = request.user
        account_users = current_user.tenant_user.get_all_account_users()
        user_to_login = next(
            (u for u in account_users if u.iaso_profile and u.iaso_profile.account_id == account_id), None
        )

        if user_to_login:
            user_to_login.backend = "iaso.auth.backends.MultiTenantAuthBackend"
            login(request, user_to_login)
            # Return an empty response since no data is needed by the frontend
            return Response({}, status=status.HTTP_200_OK)
        return Response(status=status.HTTP_404_NOT_FOUND)
