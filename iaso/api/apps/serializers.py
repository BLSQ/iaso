import logging

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from iaso.models import Project, FeatureFlag, Form
from ..projects import ProjectSerializer

logger = logging.getLogger(__name__)

REQUIRE_AUTHENTICATION_FEATURE_FLAG = "REQUIRE_AUTHENTICATION"


class AppSerializer(ProjectSerializer):
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
            "min_version",
            "created_at",
            "updated_at",
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
                f_f_object = FeatureFlag.objects.get(code=f_f["code"])
                if f_f_object.requires_authentication and not needs_authentication:
                    raise ValidationError(
                        f"'{f_f_object.code}' requires authentication. The feature flag "
                        f"'{REQUIRE_AUTHENTICATION_FEATURE_FLAG}' must be added alongside this one."
                    )
                validated_feature_flags.append(f_f)
            if needs_authentication:  # Line should be removed when this field is removed
                validated_feature_flags.append({"code": REQUIRE_AUTHENTICATION_FEATURE_FLAG})
        return validated_feature_flags

    def create(self, validated_data):
        new_app = Project()
        request = self.context["request"]
        app_id = validated_data.get("app_id", None)

        account = request.user.iaso_profile.account

        name = validated_data.get("name", None)
        forms = validated_data.get("forms", None)
        feature_flags = validated_data.get("feature_flags", None)

        new_app.app_id = app_id
        new_app.name = name
        new_app.account = account

        new_app.needs_authentication = self.needs_authentication_based_on_feature_flags(feature_flags)
        new_app.save()
        self.set_forms_and_feature_flags(new_app, forms, feature_flags)

        return new_app

    def update(self, instance, validated_data):
        feature_flags = validated_data.pop("feature_flags", None)
        forms = validated_data.pop("forms", None)
        app_id = validated_data.pop("app_id", None)
        name = validated_data.pop("name", None)
        if app_id is not None:
            instance.app_id = app_id
        if name is not None:
            instance.name = name

        instance.needs_authentication = self.needs_authentication_based_on_feature_flags(feature_flags)
        instance.save()
        self.set_forms_and_feature_flags(instance, forms, feature_flags)

        return instance

    @staticmethod
    def needs_authentication_based_on_feature_flags(feature_flags):
        if feature_flags:
            return REQUIRE_AUTHENTICATION_FEATURE_FLAG in list(f_f["code"] for f_f in feature_flags)
        return False

    @staticmethod
    def set_forms_and_feature_flags(instance, forms, feature_flags):
        if forms is not None:
            instance.forms.clear()
            for f in forms:
                instance.forms.add(f)

        if feature_flags is not None:
            instance.feature_flags.clear()
            for f_f in feature_flags:
                f_f_object = FeatureFlag.objects.get(code=f_f["code"])
                instance.feature_flags.add(f_f_object)
