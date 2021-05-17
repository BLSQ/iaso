from plugins.polio.serializers import CampaignSerializer
from rest_framework import viewsets, routers
from .models import Campaign


class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer


router = routers.SimpleRouter()
router.register(r"polio/campaigns", CampaignViewSet)
