from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, permissions, serializers

from iaso.api.common import DeletionFilterBackend, ModelViewSet
from plugins.polio.models import Campaign, CampaignGroup


class CampaignNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = ["id", "obr_name"]


class CampaignGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignGroup
        fields = "__all__"

    campaigns = CampaignNameSerializer(many=True, read_only=True)
    campaigns_ids = serializers.PrimaryKeyRelatedField(many=True, queryset=Campaign.objects.all(), source="campaigns")


class CampaignGroupSearchFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get("search")

        if search:
            queryset = queryset.filter(Q(campaigns__obr_name__icontains=search) | Q(name__icontains=search)).distinct()
        return queryset


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
