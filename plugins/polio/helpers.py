import json
from datetime import timedelta

import requests
from django.db.models import Q
from django.utils.timezone import now
from rest_framework import filters

from iaso.models import OrgUnitType, OrgUnit
from plugins.polio.models import URLCache
from logging import getLogger

logger = getLogger(__name__)


def get_url_content(url, login, password, minutes, prefer_cache: bool = False):
    """Get a URL and save the result in prod

    minutes: ttl for cache
    prefer_cache: use the cache even if expired
    """
    cached_response, created = URLCache.objects.get_or_create(url=url)
    delta = now() - cached_response.updated_at

    has_cache = bool(not created and cached_response.content)
    use_cache = delta < timedelta(minutes=minutes) or prefer_cache
    if not (has_cache and use_cache):
        logger.info(f"fetching from {url}")
        response = requests.get(url, auth=(login, password))
        response.raise_for_status()
        cached_response.content = response.text
        logger.info(f"fetched {len(response.content)} bytes")
        cached_response.save()
        j = response.json()
    else:
        logger.info(f"using cache for {url}")
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
