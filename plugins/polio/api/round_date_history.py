from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, permissions

from iaso.api.common import ModelViewSet
from plugins.polio.api.shared_serializers import RoundDateHistoryEntrySerializer
from plugins.polio.models import RoundDateHistoryEntry


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
