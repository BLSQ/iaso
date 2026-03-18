from rest_framework import serializers

from iaso.models import ValidationNodeTemplate


class ValidationNodeTemplateMoveSerializer(serializers.Serializer):
    new_previous_nodes = serializers.SlugRelatedField(
        many=True, write_only=True, queryset=ValidationNodeTemplate.objects.none(), slug_field="slug"
    )
    new_next_nodes = serializers.SlugRelatedField(
        many=True, write_only=True, queryset=ValidationNodeTemplate.objects.none(), slug_field="slug"
    )

    def __init__(self, *args, **kwargs):
        super(ValidationNodeTemplateMoveSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)

        for f in ["new_previous_nodes", "new_next_nodes"]:
            self.fields[f].child_relation.queryset = ValidationNodeTemplate.objects.filter(
                workflow__account=user.iaso_profile.account
            ).exclude(pk=self.instance.pk)
