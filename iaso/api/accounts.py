from rest_framework.request import Request

from .common import ModelViewSet, HasPermission
from iaso.models import Account, SourceVersion
from rest_framework import serializers, permissions
from rest_framework.generics import get_object_or_404


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account

        fields = [
            "id",
            "name",
            "default_version",
        ]

    def update(self, account, validated_data):
        default_version = validated_data.pop("default_version", None)
        if default_version is not None:
            sourceVersion = get_object_or_404(
                SourceVersion,
                id=default_version.id,
                number=default_version.number,
            )
            account.default_version = sourceVersion
            account.save()

        return account


class HasAccountPermission(permissions.BasePermission):
    def has_object_permission(self, request: Request, view, obj: Account):
        return request.user.iaso_profile.account == obj


class AccountViewSet(ModelViewSet):
    """Account API

    This API is restricted to authenticated users having the "menupermissions.iaso_sources" permission
    Only allow to update default source / version for an account
    PUT /api/account/<id>
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission("menupermissions.iaso_sources"),  # type: ignore
        HasAccountPermission,
    ]
    serializer_class = AccountSerializer
    results_key = "accounts"
    queryset = Account.objects.all()
    http_method_names = ["put"]
