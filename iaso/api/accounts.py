"""This api is only there so the default version on an account can be modified"""
from .common import ModelViewSet, HasPermission
from iaso.models import Account, SourceVersion

from rest_framework import serializers, permissions
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from hat.menupermissions import models as permission


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
    http_method_names = ["put"]
