import json
from datetime import timedelta

import requests
from django.db.models import Q
from django.utils.timezone import now
from rest_framework import filters

from iaso.models import OrgUnitType, OrgUnit
from plugins.polio.models import URLCache


def get_url_content(url, login, password, minutes=60):
    """Get a URL and save the result in prod"""
    cached_response, created = URLCache.objects.get_or_create(url=url)
    delta = now() - cached_response.updated_at
    if created or delta > timedelta(minutes=minutes) or not cached_response.content:
        response = requests.get(url, auth=(login, password))
        response.raise_for_status()
        cached_response.content = response.text
        cached_response.save()
        j = response.json()
    else:
        j = json.loads(cached_response.content)
    return j


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
