import logging

from urllib.parse import urlparse

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from iaso.api.projects import ProjectSerializer
from iaso.models import FeatureFlag, Form, Project
from iaso.models.project import DEFAULT_PROJECT_COLOR


logger = logging.getLogger(__name__)


class AppSerializer(ProjectSerializer):
    APP_ID = "app_id"
    COLOR = "color"
    FEATURE_FLAGS = "projectfeatureflags_set"
    FORMS = "forms"
    NAME = "name"

    """We override the project serializer to "switch" the id and app_id fields. It means that within the "apps" API,
    the app_id field from the Project model is used as the primary key."""

    class Meta(ProjectSerializer.Meta):
        model = Project
        fields = [
            "id",
            "name",
            "app_id",
            "forms",
            "feature_flags",
            "needs_authentication",
            "redirection_url",
            "min_version",
            "created_at",
            "updated_at",
            "color",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "min_version"]

    id = serializers.CharField(read_only=True, source="app_id")

    def validate_forms(self, data):
        validated_forms = []
        current_account_id = self.context["request"].user.iaso_profile.account.id
        for f in data:
            account_ids = Form.objects.filter(id=f.id).values_list("projects__account", flat=True).distinct()
            if current_account_id in account_ids:
                validated_forms.append(f)
            else:
                raise ValidationError("Form not associated to any of the accounts")
        return validated_forms

    def validate_feature_flags(self, feature_flags):
        request_needs_auth = self.context["request"].data.get("needs_authentication", None)
        needs_authentication = request_needs_auth or self.needs_authentication_based_on_feature_flags(feature_flags)
        validated_feature_flags = []
        if feature_flags is not None:
            for f_f in feature_flags:
                f_f_object = FeatureFlag.objects.get(code=f_f["featureflag"]["code"])
                if f_f_object.requires_authentication and not needs_authentication:
                    raise ValidationError(
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
        forms = validated_data.get(self.FORMS, None)
        feature_flags = validated_data.get(self.FEATURE_FLAGS, None)
        color = validated_data.get(self.COLOR, DEFAULT_PROJECT_COLOR)

        new_app.app_id = app_id
        new_app.name = name
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
        color = validated_data.pop(self.COLOR, None)
        if app_id is not None:
            instance.app_id = app_id
        if name is not None:
            instance.name = name
        if color is not None:
            instance.color = color

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
            raise ValidationError(f"A configuration must be provided for feature flag {f_f_object.code}")

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
                    raise ValidationError(f"{key} is a required configuration and cannot be blank")

            except KeyError:
                raise ValidationError(f"{key} is a required configuration")

            key_type = f_f_object.configuration_schema[key]["type"]
            try:
                value = TYPE_MAPPING[key_type](value)
            except ValueError:
                raise ValidationError(
                    f"Value '{value}' for {key} is supposed to be {key_type} but {type(value)} provided"
                )

            if key_type == "url":
                if urlparse(value).scheme not in ["http", "https"]:
                    raise ValidationError(f"Value for {key} is supposed to be an URL, '{value}' is not a valid URL")
