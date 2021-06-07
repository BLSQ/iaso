from plugins.polio.serializers import CampaignSerializer, PreparednessPreviewSerializer
from rest_framework import viewsets, routers
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Campaign
from iaso.api.common import ModelViewSet


class CampaignViewSet(ModelViewSet):
    queryset = Campaign.objects.all().order_by("-cvdpv_notified_at")
    serializer_class = CampaignSerializer
    results_key = "campaigns"
    remove_results_key_if_paginated = True

    @action(methods=["POST"], detail=False, serializer_class=PreparednessPreviewSerializer)
    def preview_preparedness(self, request, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


router = routers.SimpleRouter()
router.register(r"polio/campaigns", CampaignViewSet)
