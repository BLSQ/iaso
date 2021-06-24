from django.db.models.expressions import RawSQL
from django_filters.rest_framework import DjangoFilterBackend
from plugins.polio.serializers import SurgePreviewSerializer
from iaso.models import OrgUnit
from plugins.polio.serializers import CampaignSerializer, PreparednessPreviewSerializer
from rest_framework import routers, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Campaign
from iaso.api.common import ModelViewSet


class CampaignViewSet(ModelViewSet):
    serializer_class = CampaignSerializer
    results_key = "campaigns"
    remove_results_key_if_paginated = True
    filters.OrderingFilter.ordering_param = "order"
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    ordering_fields = ["obr_name", "cvdpv2_notified_at", "detection_status"]
    search_fields = ["obr_name", "epid"]

    def get_queryset(self):
        user = self.request.user

        search = self.request.query_params.get("search")
        if search:
            org_units = OrgUnit.objects.filter(name__icontains=search, org_unit_type=2, path__isnull=False).only("id")
            ltree_list = ", ".join(list(map(lambda org_unit: f"'{org_unit.pk}'::ltree", org_units)))
            raw_sql = RawSQL(f"array[{ltree_list}]", []) if len(ltree_list) > 0 else ""
            base_query_set = Campaign.objects.filter(initial_org_unit__path__descendants=raw_sql)
        else:
            base_query_set = Campaign.objects

        if user.iaso_profile.org_units.count():
            org_units = OrgUnit.objects.hierarchy(user.iaso_profile.org_units.all())

            return base_query_set.filter(initial_org_unit__in=org_units)
        else:
            return base_query_set.all()

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
