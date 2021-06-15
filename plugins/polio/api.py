from rest_framework.pagination import PageNumberPagination
from plugins.polio.serializers import SurgePreviewSerializer
from iaso.models import OrgUnit
from plugins.polio.serializers import CampaignSerializer, PreparednessPreviewSerializer
from rest_framework import routers
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Campaign
from iaso.api.common import ModelViewSet

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "limit"
    max_page_size = 1000

class CampaignViewSet(ModelViewSet):
    serializer_class = CampaignSerializer
    results_key = "campaigns"
    pagination_class = StandardResultsSetPagination


    def get_queryset(self):
        user = self.request.user

        if user.iaso_profile.org_units.count():
            org_units = OrgUnit.objects.hierarchy(user.iaso_profile.org_units.all())

            return Campaign.objects.filter(initial_org_unit__in=org_units).order_by("obr_name")
        else:
            return Campaign.objects.order_by("obr_name")

    @action(methods=["POST"], detail=False, serializer_class=PreparednessPreviewSerializer)
    def preview_preparedness(self, request, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

    @action(methods=["POST"], detail=False, serializer_class=SurgePreviewSerializer)
    def preview_surge(self, request, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


router = routers.SimpleRouter()
router.register(r"polio/campaigns", CampaignViewSet, basename="Campaign")
