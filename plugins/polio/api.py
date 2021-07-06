from iaso.models.org_unit import OrgUnitType
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from plugins.polio.serializers import SurgePreviewSerializer
from iaso.models import OrgUnit
from plugins.polio.serializers import CampaignSerializer, PreparednessPreviewSerializer
from django.shortcuts import get_object_or_404
from rest_framework import routers, filters, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Campaign, Config
from iaso.api.common import ModelViewSet
import requests
from django.http import JsonResponse


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


class IMViewSet(viewsets.ViewSet):
    """
           Endpoint used to transform IM (independent monitoring) data from existing ODK forms stored in ONA. Very custom to the polio project.

    sample Config:

    configs = [
           {
               "keys": {"roundNumber": "roundNumber",
                       "District": "District",
                       "Region": "Region",
                       "Response": "Response",
                       "NumberofSiteVisited": "visited",
                       "Child_Checked": "children",
                       "Child_FMD": "fm",
                       "today": "today"},
               "prefix": "OHH",
               "url": 'https://brol.com/api/v1/data/5888',
               "login": "qmsdkljf",
               "password": "qmsdlfj"
           },
           {
               "keys": {'roundNumber': "roundNumber",
                       "District": "District",
                       "Region": "Region",
                       "Response": "Response",
                       "HH_count": "visited",
                       "Total_U5_Present": "children",
                       "TotalFM": "fm",
                       "today": "today"},
               "prefix": "HH",
               "url":  'https://brol.com/api/v1/data/5887',
               "login": "qmsldkjf",
               "password": "qsdfmlkj"
           }
       ]
    """

    def list(self, request):

        slug = request.GET.get("country", None)
        config = get_object_or_404(Config, slug=slug)
        res = []
        failure_count = 0
        for config in config.content:
            keys = config["keys"]
            prefix = config["prefix"]
            response = requests.get(config["url"], auth=(config["login"], config["password"]))
            forms = response.json()

            for form in forms:
                try:
                    reduced_form = {}
                    for key in keys.keys():
                        value = form.get(key, None)
                        if value is None:
                            value = form[prefix][0]["%s/%s" % (prefix, key)]
                        reduced_form[keys[key]] = value
                        reduced_form["type"] = prefix

                    res.append(reduced_form)
                except Exception as e:
                    print("failed on ", e, form, prefix)
                    failure_count += 1
        print("parsed:", len(res), "failed:", failure_count)

        return JsonResponse(res, safe=False)


router = routers.SimpleRouter()
router.register(r"polio/campaigns", CampaignViewSet, basename="Campaign")
router.register(r"polio/im", IMViewSet, basename="IM")
