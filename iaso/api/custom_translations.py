from django.utils.translation import gettext_lazy as _
from rest_framework import serializers, status
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from iaso.models import Account

from .accounts import HasAccountPermission


class CustomTranslationsSerializer(serializers.Serializer):
    account_id = serializers.IntegerField(
        required=True,
        error_messages={"required": _("Account id is required.")},
    )


class CustomTranslationsViewSet(ViewSet):
    permission_classes = [IsAuthenticated, HasAccountPermission]
    http_method_names = ["get"]

    def list(self, request):
        serializer = CustomTranslationsSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        account = get_object_or_404(Account, id=serializer.validated_data["account_id"])
        self.check_object_permissions(request, account)
        return Response(
            {"custom_translations": account.custom_translations},
            status=status.HTTP_200_OK,
        )
