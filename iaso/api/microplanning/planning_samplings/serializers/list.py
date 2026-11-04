from rest_framework import serializers

from iaso.models import Planning


class PlanningSamplingResultListSerializer(serializers.Serializer):
    planning_id = serializers.PrimaryKeyRelatedField(queryset=Planning.objects.none())

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            self.fields["planning_id"].queryset = Planning.objects.filter_for_user(user)
