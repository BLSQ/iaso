import base64

from qr_code.qrcode.maker import make_qr_code_image
from qr_code.qrcode.utils import QRCodeOptions
from rest_framework import serializers

from iaso.models import FeatureFlag, Project, ProjectFeatureFlags

from ..common import TimestampField


class ProjectFeatureFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFeatureFlags
        fields = ["id", "name", "code", "description", "configuration", "updated_at", "created_at"]
        read_only_fields = ["updated_at", "created_at"]

    id = serializers.IntegerField(source="featureflag.id")
    name = serializers.CharField(max_length=200, source="featureflag.name")
    code = serializers.CharField(max_length=200, required=True, source="featureflag.code")
    description = serializers.CharField(
        max_length=200, required=False, allow_blank=True, source="featureflag.description"
    )
    created_at = TimestampField(read_only=True, required=False, source="featureflag.created_at")
    updated_at = TimestampField(read_only=True, required=False, source="featureflag.updated_at")

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # old versions of the mobile app do not expect a null value here
        if rep.get("configuration") is None:
            rep.pop("configuration")
        return rep


class FeatureFlagSerializer(serializers.Serializer):
    class Meta:
        model = FeatureFlag
        fields = ["id", "code", "name", "description", "configuration_schema", "created_at", "updated_at"]

    id = serializers.IntegerField()
    name = serializers.CharField(max_length=200)
    code = serializers.CharField(max_length=200, required=True)
    description = serializers.CharField(max_length=200, required=False, allow_blank=True)
    configuration_schema = serializers.JSONField(required=False, allow_null=True)
    created_at = TimestampField(read_only=True, required=False)
    updated_at = TimestampField(read_only=True, required=False)

    def validate_code(self, data):
        if FeatureFlag.objects.filter(code=data).count() == 1:
            return data
        raise serializers.ValidationError("Unknown feature flag code")


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "app_id",
            "feature_flags",
            "created_at",
            "updated_at",
            "needs_authentication",
            "qr_code",
            "color",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "qr_code"]

    feature_flags = ProjectFeatureFlagSerializer(
        many=True, required=True, allow_empty=True, source="projectfeatureflags_set"
    )
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    qr_code = serializers.SerializerMethodField()

    def get_qr_code(self, instance):
        request = self.context.get("request")
        if not request or not instance.app_id:
            return None

        qr_image = make_qr_code_image(
            data='{"url": "' + request.build_absolute_uri("/") + '", "app_id": "' + instance.app_id + '"}',
            qr_code_options=QRCodeOptions(size="S", image_format="png", error_correction="L"),
        )
        return f"data:image/png;base64,{base64.b64encode(qr_image).decode('utf-8')}"

    def validate_app_id(self, data):
        data = data.strip()
        request = self.context["request"]
        if not data:
            raise serializers.ValidationError("An App id is required")
        if data != "" and data != request.data.get("id"):
            if Project.objects.filter(app_id=data).count() > 0:
                raise serializers.ValidationError("App id already used")
        return data
