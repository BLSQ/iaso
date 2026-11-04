from django.contrib.auth import get_user_model
from rest_framework import serializers

from iaso.models import Planning, Team


User = get_user_model()


class BulkDeleteAssignmentSerializer(serializers.Serializer):
    """Bulk soft delete all assignments for a specific user and/or planning.

    Marks all assignments linked to the specified planning as deleted using the deleted_at field.
    Audit the modification.
    """

    planning = serializers.PrimaryKeyRelatedField(queryset=Planning.objects.none(), write_only=True)
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.none(), write_only=True, required=False, allow_null=True
    )
    team = serializers.PrimaryKeyRelatedField(
        queryset=Team.objects.none(), write_only=True, required=False, allow_null=True
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return
        self.fields["planning"].queryset = Planning.objects.filter_for_user(user)
        self.fields["user"].queryset = User.objects.select_related("iaso_profile__account").filter(
            iaso_profile__account__id=user.iaso_profile.account.id
        )
        self.fields["team"].queryset = Team.objects.filter_for_user(user)


class BulkDeleteAssignmentResponseSerializer(serializers.Serializer):
    message = serializers.CharField(read_only=True)
    deleted_count = serializers.IntegerField(read_only=True)
    planning_id = serializers.IntegerField(read_only=True)
    user = serializers.IntegerField(allow_null=True, read_only=True)
