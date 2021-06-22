import django_filters
from django_filters.rest_framework import DjangoFilterBackend
from plugins.polio.serializers import SurgePreviewSerializer
from iaso.models import OrgUnit
from plugins.polio.serializers import CampaignSerializer, PreparednessPreviewSerializer
from rest_framework import routers, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Campaign
from iaso.api.common import ModelViewSet


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    pass


class CampaignFilterSet(django_filters.FilterSet):
    countries = NumberInFilter(field_name="initial_org_unit__org_unit_type", lookup_expr="in")

    class Meta:
        model = Campaign
        fields = ["countries"]


class CampaignViewSet(ModelViewSet):
    serializer_class = CampaignSerializer
    filterset_class = CampaignFilterSet
    results_key = "campaigns"
    remove_results_key_if_paginated = True
    filters.OrderingFilter.ordering_param = "order"
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    ordering_fields = ["obr_name", "cvdpv2_notified_at", "detection_status"]
    search_fields = ["obr_name", "epid", "initial_org_unit__name"]

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
