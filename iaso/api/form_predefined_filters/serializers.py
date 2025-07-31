from rest_framework import serializers

from iaso.api.common import TimestampField
from iaso.api.query_params import FORM_ID
from iaso.models import Form, FormPredefinedFilter


class FormIdSerializer(serializers.Serializer):
    f"""
        Serializer for `{FORM_ID}` when passed in query_params.

        Used to handle parsing and errors:

            serializer = FormIdSerializer(data=self.request.query_params)
            serializer.is_valid(raise_exception=True)
            form_id = serializer.validated_data[FORM_ID]
        """

    form_id = serializers.CharField(allow_blank=False)


class FormPredefinedFilterSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormPredefinedFilter
        fields = ["id", "form_id", "name", "short_name", "json_logic", "created_at", "updated_at"]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    form_id = serializers.PrimaryKeyRelatedField(source="form", queryset=Form.objects.all())
