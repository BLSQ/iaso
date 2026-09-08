import base64
import io
import textwrap

from urllib.parse import urlparse

from PIL import Image, ImageDraw, ImageFont
from qr_code.qrcode.maker import make_qr_code_image
from qr_code.qrcode.utils import QRCodeOptions
from rest_framework import serializers

from iaso.models import FeatureFlag, Form, Project, ProjectFeatureFlags
from iaso.models.project import DEFAULT_COLOR

from ..common import ModelSerializer, TimestampField


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


class ProjectSerializer(ModelSerializer):
    APP_ID = "app_id"
    COLOR = "color"
    DESCRIPTION = "description"
    FEATURE_FLAGS = "projectfeatureflags_set"
    FORMS = "forms"
    NAME = "name"

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "app_id",
            "description",
            "feature_flags",
            "forms",
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
    # `forms` is write-only here so the projects read contract (and its query count) is unchanged.
    # `AppSerializer` re-declares it as readable for the mobile API.
    forms = serializers.PrimaryKeyRelatedField(many=True, queryset=Form.objects.all(), required=False, write_only=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    qr_code = serializers.SerializerMethodField()

    def get_qr_code(self, instance):
        request = self.context.get("request")
        if not request or not instance.app_id:
            return None
        # create an empty image or load your image here
        url = request.build_absolute_uri("/")
        app_id = instance.app_id
        qr_image = Image.open(
            io.BytesIO(
                make_qr_code_image(
                    data='{"url": "' + url + '", "app_id": "' + app_id + '"}',
                    qr_code_options=QRCodeOptions(size="S", image_format="png", error_correction="L"),
                )
            )
        )
        width, height = qr_image.size
        qr_image = qr_image.crop((0, 0, width, height + 100))  # add 100 pixels to write the app_id and url
        draw = ImageDraw.Draw(qr_image)
        draw.line([(0, height + 50), (width, height + 50)], "white", 110)  # make sure the 100 added pixels are white
        font = ImageFont.load_default(size=20)
        app_id = "\n".join(textwrap.wrap(app_id, width=45))  # make sure the app_id won't be too long
        draw.multiline_text((width / 2, height + 10), app_id, 0, font=font, anchor="mm", align="center")
        url = "\n".join(textwrap.wrap(url, width=45))  # make sure the url won't be too long
        draw.multiline_text((width / 2, height + 60), url, 0, font=font, anchor="mm", align="center", spacing=6)
        img_byte_arr = io.BytesIO()
        qr_image.save(img_byte_arr, format="PNG")
        return f"data:image/png;base64,{base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')}"

    def validate_app_id(self, data):
        data = data.strip()
        if not data:
            raise serializers.ValidationError("An App id is required")
        queryset = Project.objects.filter(app_id=data)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("App id already used")
        return data

    def validate_forms(self, data):
        validated_forms = []
        current_account_id = self.context["request"].user.iaso_profile.account.id
        for f in data:
            account_ids = Form.objects.filter(id=f.id).values_list("projects__account", flat=True).distinct()
            if current_account_id in account_ids:
                validated_forms.append(f)
            else:
                raise serializers.ValidationError("Form not associated to any of the accounts")
        return validated_forms

    def validate_feature_flags(self, feature_flags):
        request_needs_auth = self.context["request"].data.get("needs_authentication", None)
        needs_authentication = request_needs_auth or self.needs_authentication_based_on_feature_flags(feature_flags)
        validated_feature_flags = []
        if feature_flags is not None:
            for f_f in feature_flags:
                f_f_object = FeatureFlag.objects.get(code=f_f["featureflag"]["code"])
                if f_f_object.requires_authentication and not needs_authentication:
                    raise serializers.ValidationError(
                        f"'{f_f_object.code}' requires authentication. The feature flag "
                        f"'{FeatureFlag.REQUIRE_AUTHENTICATION}' must be added alongside this one."
                    )
                self.validate_configuration(f_f, f_f_object)
                validated_feature_flags.append(f_f)
            if needs_authentication:  # Line should be removed when this field is removed
                if not self.needs_authentication_based_on_feature_flags(validated_feature_flags):
                    validated_feature_flags.append({"featureflag": {"code": FeatureFlag.REQUIRE_AUTHENTICATION}})
        return validated_feature_flags

    def create(self, validated_data):
        new_app = Project()
        request = self.context["request"]
        app_id = validated_data.get(self.APP_ID, None)

        account = request.user.iaso_profile.account

        name = validated_data.get(self.NAME, None)
        description = validated_data.get(self.DESCRIPTION, "")
        forms = validated_data.get(self.FORMS, None)
        feature_flags = validated_data.get(self.FEATURE_FLAGS, None)
        color = validated_data.get(self.COLOR, DEFAULT_COLOR)

        new_app.app_id = app_id
        new_app.name = name
        new_app.description = description
        new_app.account = account
        new_app.color = color

        new_app.needs_authentication = self.needs_authentication_based_on_feature_flags(feature_flags)
        new_app.save()
        self.set_forms_and_feature_flags(new_app, forms, feature_flags)

        return new_app

    def update(self, instance, validated_data):
        feature_flags = validated_data.pop(self.FEATURE_FLAGS, None)
        forms = validated_data.pop(self.FORMS, None)
        app_id = validated_data.pop(self.APP_ID, None)
        name = validated_data.pop(self.NAME, None)
        description = validated_data.get(self.DESCRIPTION, "")
        color = validated_data.pop(self.COLOR, None)
        if app_id is not None:
            instance.app_id = app_id
        if name is not None:
            instance.name = name
        if validated_data.get(self.DESCRIPTION, None) is not None:
            instance.description = description
        if color is not None:
            instance.color = color

        # Only recompute `needs_authentication` when feature flags are part of the payload.
        # On a partial update (PATCH) that omits `feature_flags`, the existing flags are kept
        # (see `set_forms_and_feature_flags`), so resetting this flag would desync the two.
        if feature_flags is not None:
            instance.needs_authentication = self.needs_authentication_based_on_feature_flags(feature_flags)
        instance.save()
        self.set_forms_and_feature_flags(instance, forms, feature_flags)

        return instance

    @staticmethod
    def needs_authentication_based_on_feature_flags(feature_flags):
        if feature_flags:
            return FeatureFlag.REQUIRE_AUTHENTICATION in list(f_f["featureflag"]["code"] for f_f in feature_flags)
        return False

    @staticmethod
    def set_forms_and_feature_flags(instance: Project, forms, feature_flags):
        if forms is not None:
            instance.forms.clear()
            for f in forms:
                instance.forms.add(f)

        if feature_flags is not None:
            instance.feature_flags.clear()
            for f_f in feature_flags:
                f_f_object = FeatureFlag.objects.get(code=f_f["featureflag"]["code"])
                instance.feature_flags.add(
                    f_f_object, through_defaults={"configuration": f_f.get("configuration", None)}
                )

    @staticmethod
    def validate_configuration(f_f, f_f_object: FeatureFlag) -> None:
        if f_f_object.configuration_schema is None:
            return

        try:
            configuration = f_f["configuration"]
        except KeyError:
            raise serializers.ValidationError(f"A configuration must be provided for feature flag {f_f_object.code}")

        TYPE_MAPPING = {
            "int": int,
            "long": int,
            "number": int,
            "float": float,
            "double": float,
            "decimal": float,
            "url": str,
            "text": str,
            "str": str,
            "string": str,
        }
        for key in f_f_object.configuration_schema:
            try:
                value = configuration[key]
                if value == "":
                    raise serializers.ValidationError(f"{key} is a required configuration and cannot be blank")

            except KeyError:
                raise serializers.ValidationError(f"{key} is a required configuration")

            key_type = f_f_object.configuration_schema[key]["type"]
            try:
                value = TYPE_MAPPING[key_type](value)
            except ValueError:
                raise serializers.ValidationError(
                    f"Value '{value}' for {key} is supposed to be {key_type} but {type(value)} provided"
                )

            if key_type == "url":
                if urlparse(value).scheme not in ["http", "https"]:
                    raise serializers.ValidationError(
                        f"Value for {key} is supposed to be an URL, '{value}' is not a valid URL"
                    )
