from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from hat.api_import.models import APIImport
from iaso.api.common import TimestampField


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]
        ref_name = "UserNestedSerializerForFormVersions"


class APIImportSerializer(serializers.ModelSerializer):
    user = UserNestedSerializer(read_only=True)
    headers = serializers.SerializerMethodField(method_name="get_headers")
    created_at = TimestampField(read_only=True)

    class Meta:
        model = APIImport
        fields = [
            "created_at",
            "user",
            "import_type",
            "json_body",
            "headers",
            "has_problem",
            "file",
            "app_id",
            "app_version",
        ]

    @staticmethod
    @extend_schema_field(serializers.JSONField())
    def get_headers(obj):
        """
        Method to remove the bearer tokens from the answer. We can safely remove it after we run the clean-up script.
        """
        if obj.headers:
            obj.headers.pop("HTTP_AUTHORIZATION", None)
        return obj.headers
