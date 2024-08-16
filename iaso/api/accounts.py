"""This api is only there so the default version on an account can be modified"""

from .common import ModelViewSet, HasPermission
from iaso.models import Account, SourceVersion

from rest_framework import serializers, permissions, status
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from hat.menupermissions import models as permission

from django.contrib.auth.models import User
from django.contrib.auth import login
from rest_framework.response import Response


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

    This API is restricted to authenticated users having the "{permission.SOURCES}" permission
    Only allow to update default source / version for an account
    PUT /api/account/<id>
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(permission.SOURCES),  # type: ignore
        HasAccountPermission,
    ]
    serializer_class = AccountSerializer
    results_key = "accounts"
    queryset = Account.objects.all()
    # FIXME: USe a PATCH in the future, it make more sense regarding HTTP method semantic
    http_method_names = ["patch", "put"]

    @action(detail=False, methods=["patch"], url_path="switch")
    def switch(self, request):
        print("SWITCH ACCOUNT!")
        print("SWITCH ACCOUNT!")
        print("SWITCH ACCOUNT!")
        print(request.data)
        account_id = request.data.get("account_id", None)

        # current_user = request.user
        # print("current_user.backend", current_user.backend)

        # account = Account.objects.get(id=account_id)
        user = User.objects.get(id=3)
        user.backend = "django.contrib.auth.backends.ModelBackend"

        login(request, user)

        return Response(status=status.HTTP_204_NO_CONTENT)
