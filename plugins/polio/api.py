from plugins.polio.serializers import SurgePreviewSerializer
import itertools
from iaso.models import OrgUnit
from plugins.polio.serializers import CampaignSerializer, PreparednessPreviewSerializer
from rest_framework import routers
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import action
from .models import Campaign
from iaso.api.common import ModelViewSet


class CampaignViewSet(ModelViewSet):
    serializer_class = CampaignSerializer
    results_key = "campaigns"
    remove_results_key_if_paginated = True

    def list(self, request: Request, *args, **kwargs):
        order = self.request.GET.get("order", "obr_name")
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
