from iaso.models.org_unit import OrgUnitType
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from plugins.polio.serializers import SurgePreviewSerializer
from iaso.models import OrgUnit
from plugins.polio.serializers import CampaignSerializer, PreparednessPreviewSerializer
from rest_framework import routers, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Campaign
from iaso.api.common import ModelViewSet


class CustomFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get("search")
        if search:
            country_types = OrgUnitType.objects.countries().only("id")
            org_units = OrgUnit.objects.filter(
                name__icontains=search, org_unit_type__in=country_types, path__isnull=False
            ).only("id")

            query = Q(obr_name__icontains=search) | Q(epid__icontains=search)
            if len(org_units) > 0:
                query.add(
                    Q(initial_org_unit__path__descendants=OrgUnit.objects.query_for_related_org_units(org_units)), Q.OR
                )

            return queryset.filter(query)

        return queryset


class CampaignViewSet(ModelViewSet):
    serializer_class = CampaignSerializer
    results_key = "campaigns"
    remove_results_key_if_paginated = True
    filters.OrderingFilter.ordering_param = "order"
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, CustomFilterBackend]
    ordering_fields = ["obr_name", "cvdpv2_notified_at", "detection_status"]

    def get_queryset(self):
        user = self.request.user

        if user.iaso_profile.org_units.count():
            org_units = OrgUnit.objects.hierarchy(user.iaso_profile.org_units.all())

            return Campaign.objects.filter(initial_org_unit__in=org_units)
        else:
            return Campaign.objects.all()

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
