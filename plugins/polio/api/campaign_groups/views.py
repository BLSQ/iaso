from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, permissions

from iaso.api.common import DeletionFilterBackend, ModelViewSet
from plugins.polio.api.campaign_groups.filters import CampaignGroupSearchFilterBackend
from plugins.polio.api.campaign_groups.serializers import CampaignGroupSerializer
from plugins.polio.models import CampaignGroup


class CampaignGroupViewSet(ModelViewSet):
    results_key = "results"
    queryset = CampaignGroup.objects.all()
    serializer_class = CampaignGroupSerializer

    # We allow anonymous read access for the embeddable calendar map view
    # in this case we use a restricted serializer with less field
    # notably not the url that we want to remain private.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        CampaignGroupSearchFilterBackend,
        DeletionFilterBackend,
    ]
    ordering_fields = ["id", "name", "created_at", "updated_at"]
    filterset_fields = {
        "name": ["icontains"],
    }
