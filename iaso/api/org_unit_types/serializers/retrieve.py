import base64

from drf_spectacular.utils import extend_schema_field
from qr_code.qrcode.maker import make_qr_code_image
from qr_code.qrcode.utils import QRCodeOptions
from rest_framework import serializers

from dynamic_fields.serializer import DynamicFieldsModelSerializerBackwardCompatible
from iaso.api.common import ModelSerializer, TimestampField
from iaso.models import Form, OrgUnitType, Project, ProjectFeatureFlags


class NestedProjectFeatureFlagSerializer(ModelSerializer):
    class Meta:
        model = ProjectFeatureFlags
        fields = ["id", "name", "code", "description", "configuration", "updated_at", "created_at"]

    id = serializers.IntegerField(source="featureflag.id", read_only=True)
    name = serializers.CharField(max_length=200, source="featureflag.name", read_only=True)
    code = serializers.CharField(
        max_length=200, allow_null=False, allow_blank=False, source="featureflag.code", read_only=True
    )
    description = serializers.CharField(
        max_length=200, allow_blank=True, source="featureflag.description", read_only=True
    )
    created_at = TimestampField(read_only=True, allow_null=False, source="featureflag.created_at")
    updated_at = TimestampField(read_only=True, allow_null=False, source="featureflag.updated_at")


class NestedProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "app_id",
            "description",
            "feature_flags",
            "created_at",
            "updated_at",
            "needs_authentication",
            "qr_code",
            "color",
        ]

    feature_flags = NestedProjectFeatureFlagSerializer(
        many=True, allow_empty=True, source="projectfeatureflags_set", read_only=True
    )
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    qr_code = serializers.SerializerMethodField()

    @extend_schema_field(serializers.CharField)
    def get_qr_code(self, instance):
        request = self.context.get("request")
        if not request or not instance.app_id:
            return None

        qr_image = make_qr_code_image(
            data='{"url": "' + request.build_absolute_uri("/") + '", "app_id": "' + instance.app_id + '"}',
            qr_code_options=QRCodeOptions(size="S", image_format="png", error_correction="L"),
        )
        return f"data:image/png;base64,{base64.b64encode(qr_image).decode('utf-8')}"


class NestedFormSerializer(ModelSerializer):
    projects = NestedProjectSerializer(read_only=True, many=True)

    class Meta:
        model = Form
        fields = ["id", "form_id", "created_at", "updated_at", "projects"]


class NestedSubUnitTypeSerializer(ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "short_name", "depth", "created_at", "updated_at"]


class OrgUnitTypeRetrieveSerializer(DynamicFieldsModelSerializerBackwardCompatible):
    projects = NestedProjectSerializer(many=True, read_only=True)
    sub_unit_types = serializers.SerializerMethodField(read_only=True)
    allow_creating_sub_unit_types = serializers.SerializerMethodField(read_only=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    reference_forms = NestedFormSerializer(many=True, read_only=True)
    units_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = OrgUnitType
        fields = [
            "id",
            "name",
            "short_name",
            "depth",
            "projects",
            "sub_unit_types",
            "allow_creating_sub_unit_types",
            "created_at",
            "updated_at",
            "reference_forms",
            "units_count",
        ]

    @extend_schema_field(NestedSubUnitTypeSerializer(many=True, allow_empty=True, read_only=True))
    def get_sub_unit_types(self, obj: OrgUnitType):
        # Filter sub unit types to show only visible items for the current app id
        unit_types = obj.sub_unit_types.all()
        app_id = self.context["request"].query_params.get("app_id")
        if app_id is not None:
            unit_types = unit_types.filter(projects__app_id=app_id)

        return NestedSubUnitTypeSerializer(
            unit_types,
            many=True,
            context=self.context,
        ).data

    @extend_schema_field(NestedSubUnitTypeSerializer(many=True, allow_empty=True, read_only=True))
    def get_allow_creating_sub_unit_types(self, obj: OrgUnitType):
        # Filter sub unit types to show only visible items for the current app id
        unit_types = obj.allow_creating_sub_unit_types.all()
        app_id = self.context["request"].query_params.get("app_id")
        if app_id is not None:
            unit_types = unit_types.filter(projects__app_id=app_id)

        return NestedSubUnitTypeSerializer(
            unit_types,
            many=True,
            context=self.context,
        ).data

    @extend_schema_field(serializers.IntegerField)
    def get_units_count(self, obj: OrgUnitType):
        # Show count if it's a detail view OR if with_units_count parameter is present
        return obj.org_units.filter_for_user_and_app_id(
            self.context["request"].user, self.context["request"].query_params.get("app_id")
        ).count()
