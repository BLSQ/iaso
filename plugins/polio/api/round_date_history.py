from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, permissions, serializers
from rest_framework.fields import Field

from iaso.api.common import ModelViewSet
from iaso.api.serializers import UserSerializer
from plugins.polio.models import RoundDateHistoryEntry


class RoundDateHistoryEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundDateHistoryEntry
        fields = [
            "created_at",
            "reason",
            "ended_at",
            "started_at",
            "round",
            "previous_ended_at",
            "previous_started_at",
            "modified_by",
        ]

    modified_by = UserSerializer(required=False, read_only=True)
    round: Field = serializers.PrimaryKeyRelatedField(read_only=True, many=False)

    def validate(self, data):
        if not data["reason"]:
            raise serializers.ValidationError("No reason provided")
        start_date = data["started_at"]
        end_date = data["ended_at"]
        start_date_changed = start_date != data["previous_started_at"]
        end_date_changed = start_date != data["previous_ended_at"]
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError("End date should be after start date")
        if not start_date_changed and not end_date_changed:
            raise serializers.ValidationError("No date was modified")
        return super().validate(data)


@swagger_auto_schema(tags=["datelogs"])
class RoundDateHistoryEntryViewset(ModelViewSet):
    http_method_names = ["get"]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = RoundDateHistoryEntrySerializer
    ordering_fields = ["modified_by", "created_at"]
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
    ]
    filterset_fields = {
        "round__id": ["exact"],
    }

    def get_queryset(self):
        user = self.request.user
        return RoundDateHistoryEntry.objects.filter_for_user(user)
