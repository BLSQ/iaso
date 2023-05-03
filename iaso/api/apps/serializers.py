import logging

from rest_framework import serializers

from iaso.models import Project, FeatureFlag, Form
from ..projects import ProjectSerializer

logger = logging.getLogger(__name__)


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
                raise serializers.ValidationError("Form not associated to any of the accounts")
        return validated_forms

    def create(self, validated_data):
        new_app = Project()
        request = self.context["request"]
        app_id = validated_data.get("app_id", None)

        account = request.user.iaso_profile.account

        name = validated_data.get("name", None)
        forms = validated_data.get("forms", None)
        needs_auth = validated_data.get("needs_authentication", None)
        feature_flags = validated_data.get("feature_flags", None)

        new_app.app_id = app_id
        new_app.name = name
        new_app.account = account
        new_app.needs_authentication = False if needs_auth is None else needs_auth
        if "REQUIRE_AUTHENTICATION" in list(f_f["code"] for f_f in feature_flags):
            new_app.needs_authentication = True
        else:
            new_app.needs_authentication = False

        new_app.save()

        if forms is not None:
            for f in forms:
                new_app.forms.add(f)

        if feature_flags is not None:
            for f_f in feature_flags:
                f_f_object = FeatureFlag.objects.get(code=f_f["code"])
                new_app.feature_flags.add(f_f_object)
            if needs_auth == True:  # Line should be removed when this field is removed
                new_app.feature_flags.add(FeatureFlag.objects.get(code="REQUIRE_AUTHENTICATION"))
            # else:
            #     new_app.feature_flags.remove(FeatureFlag.objects.get(code="REQUIRE_AUTHENTICATION"))

        return new_app

    def update(self, instance, validated_data):

        feature_flags = validated_data.pop("feature_flags", None)
        needs_authentication = validated_data.pop("needs_authentication", None)
        forms = validated_data.pop("forms", None)
        app_id = validated_data.pop("app_id", None)
        name = validated_data.pop("name", None)
        if app_id is not None:
            instance.app_id = app_id
        if name is not None:
            instance.name = name
        if needs_authentication is not None:  # Line should be removed when this field is removed
            instance.needs_authentication = needs_authentication
        if "REQUIRE_AUTHENTICATION" in list(f_f["code"] for f_f in feature_flags):
            instance.needs_authentication = True
        else:
            instance.needs_authentication = False

        instance.save()

        if forms is not None:
            instance.forms.clear()
            for f in forms:
                instance.forms.add(f)

        if feature_flags is not None:
            instance.feature_flags.clear()
            for f_f in feature_flags:
                f_f_object = FeatureFlag.objects.get(code=f_f["code"])
                instance.feature_flags.add(f_f_object)
            if needs_authentication == True:  # Line should be removed when this field is removed
                instance.feature_flags.add(FeatureFlag.objects.get(code="REQUIRE_AUTHENTICATION"))

        return instance
