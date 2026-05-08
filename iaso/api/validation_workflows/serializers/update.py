from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from iaso.api.common import ModelSerializer
from iaso.models import Form, ValidationWorkflow


class ValidationWorkflowUpdateSerializer(ModelSerializer):
    forms = serializers.PrimaryKeyRelatedField(
        queryset=Form.objects.none(), many=True, required=False, source="form_set", write_only=True, allow_empty=True
    )

    class Meta:
        model = ValidationWorkflow
        fields = ["name", "description", "slug", "forms"]

        extra_kwargs = {"name": {"write_only": True}, "description": {"write_only": True}, "slug": {"read_only": True}}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        iaso_profile = getattr(user, "iaso_profile", None)
        self.fields["forms"].child_relation.queryset = Form.objects.filter_for_user_and_app_id(user)

        if getattr(iaso_profile, "account", None):
            self.fields["name"].validators.append(
                UniqueValidator(queryset=ValidationWorkflow.objects.filter(account=user.iaso_profile.account))
            )

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request and request.user:
            instance.updated_by = request.user
        return super().update(instance, validated_data)
