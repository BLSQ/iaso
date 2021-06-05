from plugins.polio.serializers import CampaignSerializer, PreparednessPreviewSerializer
from rest_framework import viewsets, routers
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import action
from .models import Campaign
from iaso.api.common import ModelViewSet


class CampaignViewSet(ModelViewSet):
    queryset = Campaign.objects.all().order_by("obr_name")
    serializer_class = CampaignSerializer
    results_key = "campaigns"
    remove_results_key_if_paginated = True
    
    def list(self, request: Request, *args, **kwargs):
        print(self.request.GET.get("order",""))
        order = self.request.GET.get("order","")
        queryset = self.filter_queryset(self.get_queryset().order_by(order))

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        if not self.remove_results_key_if_paginated:
            return Response({self.get_results_key(): serializer.data})
        else:
            return Response(serializer.data)

    @action(methods=["POST"], detail=False, serializer_class=PreparednessPreviewSerializer)
    def preview_preparedness(self, request, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


router = routers.SimpleRouter()
router.register(r"polio/campaigns", CampaignViewSet)
