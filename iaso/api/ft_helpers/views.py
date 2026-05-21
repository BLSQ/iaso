import os

from django.core.management import call_command
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.response import Response
from rest_framework.settings import api_settings

from .permissions import IsTestModeEnabled
from .serializers import CreateUserSerializer


@extend_schema(tags=["FT Helpers"])
class FunctionalTestHelperViewSet(viewsets.GenericViewSet):
    permission_classes = [IsTestModeEnabled]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]

    def get_serializer_class(self):
        if self.action == "create_user":
            return CreateUserSerializer

    def perform_create(self, serializer):
        serializer.save()

    def get_success_headers(self, data):
        try:
            return {"Location": str(data[api_settings.URL_FIELD_NAME])}
        except (TypeError, KeyError):
            return {}

    @extend_schema(responses={201: None})
    @action(detail=False, methods=["POST"], url_path="create-user")
    def create_user(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(status=status.HTTP_201_CREATED, headers=headers)

    @extend_schema(responses={204: None})
    @action(detail=False, methods=["POST"], url_path="clean-database")
    def clean_database(self, request):
        # before flushing, get all feature flags as those are created in the migrations
        account_ff_file_path = "account_ff_backup.json"
        call_command("dumpdata", "iaso.AccountFeatureFlag", indent=2, output=account_ff_file_path)

        call_command("flush", "--noinput")

        call_command("loaddata", account_ff_file_path)
        os.remove(account_ff_file_path)

        return Response(status=status.HTTP_204_NO_CONTENT)
