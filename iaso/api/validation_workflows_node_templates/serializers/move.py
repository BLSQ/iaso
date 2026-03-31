from rest_framework import serializers

from iaso.models import ValidationNodeTemplate
from iaso.models.validation_workflow.templates import PositionChoices


class ValidationNodeTemplateMoveSerializer(serializers.Serializer):
    parent_node_templates = serializers.SlugRelatedField(
        slug_field="slug", many=True, write_only=True, required=False, queryset=ValidationNodeTemplate.objects.none()
    )

    position = serializers.ChoiceField(choices=PositionChoices.choices, write_only=True, required=True)

    def __init__(self, *args, **kwargs):
        super(ValidationNodeTemplateMoveSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        iaso_profile = getattr(user, "iaso_profile", None)

        if getattr(iaso_profile, "account", None):
            self.fields["parent_node_templates"].child_relation.queryset = ValidationNodeTemplate.objects.filter(
                workflow__account=user.iaso_profile.account
            ).exclude(pk=self.instance.pk)

    def validate_parent_node_templates(self, data):
        ids = [item.id for item in data]

        # linear for the moment
        if len(ids) > 1:
            raise serializers.ValidationError("One node maximum allowed.")

        # won't happen for the moment but might be useful later when we allow more than one node
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Duplicate nodes are not allowed.")

        return data

    def validate(self, attrs):
        if attrs.get("position", "") == PositionChoices.child_of and not attrs.get("parent_node_templates"):
            raise serializers.ValidationError(
                f"Parent node templates are required if position is set to {PositionChoices.child_of}."
            )
        return attrs
