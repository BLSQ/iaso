from rest_framework import serializers
from rest_framework.response import Response
from ..projects import ProjectSerializer
from iaso.models import Project, FeatureFlag, Form
from hat.audit import models as audit_models
import logging

logger = logging.getLogger(__name__)


class AppSerializer(ProjectSerializer):
    """We override the project serializer to "switch" the id and app_id fields. It means that within the "apps" API,
    the app_id field from the Project model is used as the primary key."""

    class Meta(ProjectSerializer.Meta):
        model = Project
        fields = ["id", "name", "app_id", "forms", "feature_flags", "needs_authentication", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    id = serializers.CharField(read_only=True, source="app_id")

    # def validate(self): TODO
    #     print(forms)
    #     for f in forms:
    #         account_ids = Form.objects.filter(id=f.id).values_list("projects__account", flat=True)
    #         account = self.request.user.iaso_profile.account
    #         if not account.id in account_ids:
    #
    #     print("------", account_ids)

    def create(self, validated_data):
        new_app = Project()
        request = self.context["request"]

        account = request.user.iaso_profile.account
        app_id = validated_data.get("app_id", None)
        name = validated_data.get("name", None)
        forms = validated_data.get("forms", None)
        needs_auth = validated_data.get("needs_authentication", None)
        feature_flags = validated_data.get("feature_flags", None)

        accounts = Form.objects.filter(id__in=forms).values_list("projects__account")
        print("------", accounts)

        new_app.app_id = app_id
        new_app.name = name
        new_app.account = account
        new_app.needs_authentication = False if needs_auth is None else needs_auth

        new_app.save()

        if forms is not None:
            for f in forms:
                new_app.forms.add(f)

        if needs_auth == True:
            new_app.feature_flags.add(FeatureFlag.objects.get(code="REQUIRE_AUTHENTICATION"))

        if feature_flags is not None:
            for f_f in feature_flags:
                f_f_object = FeatureFlag.objects.get(code=f_f["code"])
                new_app.feature_flags.add(f_f_object)

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
        if needs_authentication is not None:
            instance.needs_authentication = needs_authentication
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
            if needs_authentication == True:
                instance.feature_flags.add(FeatureFlag.objects.get(code="REQUIRE_AUTHENTICATION"))
            else:
                instance.feature_flags.remove(FeatureFlag.objects.get(code="REQUIRE_AUTHENTICATION"))

        return instance
