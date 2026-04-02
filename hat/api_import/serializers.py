from rest_framework import serializers

from hat.api_import.models import APIImport
from iaso.api.common import TimestampField
from iaso.api.form_versions.serializers import UserNestedSerializer


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
    def get_headers(obj):
        """
        Method to remove the bearer tokens from the answer. We can safely remove it after we run the clean-up script.
        """
        if obj.headers:
            obj.headers.pop("HTTP_AUTHORIZATION", None)
        return obj.headers
