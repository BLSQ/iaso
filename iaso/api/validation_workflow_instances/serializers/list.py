from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Form, Instance, Project, ValidationNodeTemplate


class ProjectNestedSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "color"]


class NodeTemplateNestedSerializer(ModelSerializer):
    class Meta:
        model = ValidationNodeTemplate
        fields = ["name", "color"]


class FormNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = ["id", "name"]


class ValidationWorkflowInstanceListSerializer(ModelSerializer):
    project = ProjectNestedSerializer(read_only=True)
    user_has_been_involved = serializers.BooleanField(read_only=True, source="annotate_user_has_been_involved")
    requires_user_action = serializers.BooleanField(read_only=True, source="annotate_requires_user_action")
    last_updated = serializers.DateTimeField(read_only=True, source="annotate_last_updated")
    form = FormNestedSerializer(read_only=True)

    class Meta:
        model = Instance
        fields = [
            "id",
            "form",
            "project",
            "general_validation_status",
            "user_has_been_involved",
            "requires_user_action",
            "last_updated",
        ]
