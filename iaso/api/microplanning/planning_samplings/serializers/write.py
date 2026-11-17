from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Group, Planning, Task
from iaso.models.microplanning import PlanningSamplingResult


class PlanningSamplingResultWriteSerializer(ModelSerializer):
    planning_id = serializers.PrimaryKeyRelatedField(
        queryset=Planning.objects.none(),
        source="planning",
        write_only=True,
    )
    group_id = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.none(),
        allow_null=True,
        required=False,
        source="group",
    )
    task_id = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.none(),
        allow_null=True,
        required=False,
        source="task",
    )

    class Meta:
        model = PlanningSamplingResult
        fields = [
            "planning_id",
            "task_id",
            "pipeline_id",
            "pipeline_version",
            "pipeline_name",
            "group_id",
            "parameters",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            account = user.iaso_profile.account
            self.fields["planning_id"].queryset = Planning.objects.filter(project__account=account)
            self.fields["group_id"].queryset = Group.objects.filter_for_user(user)
            self.fields["task_id"].queryset = Task.objects.filter(account=account)
