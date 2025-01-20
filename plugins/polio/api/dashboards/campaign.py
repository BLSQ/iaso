from rest_framework import permissions, serializers

from iaso.api.common import EtlModelViewset
from plugins.polio.models import Campaign


class CampaignDashboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        exclude = ["geojson"]


class CampaignDashboardViewSet(EtlModelViewset):
    """
    GET /api/polio/dashboards/campaigns/
    Returns all campaigns for the user's account, excluding those that are deleted
    Simple endpoint that returns all model fields to facilitate data manipulation by OpenHexa or PowerBI
    """

    http_method_names = ["get"]
    permission_classes = [permissions.IsAuthenticated]
    model = Campaign
    serializer_class = CampaignDashboardSerializer

    def get_queryset(self):
        return Campaign.objects.filter(account=self.request.user.iaso_profile.account, deleted_at__isnull=True)
