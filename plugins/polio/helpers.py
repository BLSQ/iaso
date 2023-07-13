from functools import reduce
import json
from datetime import datetime, timedelta

import requests
from django.db.models import Q
from django.utils.timezone import now
from iaso.api.common import ModelViewSet
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
        page = 1
        empty = False
        j = []
        while not empty:
            paginated_url = url + ("&page=%d&page_size=10000" % page)
            logger.info("paginated_url: " + paginated_url)
            response = requests.get(paginated_url, auth=(login, password))

            empty = response.status_code == 404
            if not empty:
                response.raise_for_status()

                content = response.json()
                empty = len(content) == 0
                j.extend(response.json())
                page = page + 1
        cached_response.content = json.dumps(j)
        logger.info(f"fetched {len(cached_response.content)} bytes")
        cached_response.save()
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


def determine_status_for_district(district_data):
    if not district_data:
        return "inScope"
    checked = district_data["total_child_checked"]
    marked = district_data["total_child_fmd"]
    if checked == 60:
        if marked > 56:
            return "1lqasOK"
    return "3lqasFail"


def reduce_to_country_status(total, current):
    if not total.get("passed", None):
        total["passed"] = 0
    if not total.get("total", None):
        total["total"] = 0
    try:
        index = int(current[0])
    except:
        index = 0
    if index == 1:
        total["passed"] = total["passed"] + 1
    total["total"] = total["total"] + 1
    return total


def get_latest_round_number(country_data):
    data_for_all_rounds = sorted(country_data["rounds"], key=lambda round: round["number"], reverse=True)
    return data_for_all_rounds[0]["number"] if data_for_all_rounds else None


def get_penultimate_round_number(country_data):
    data_for_all_rounds = sorted(country_data["rounds"], key=lambda round: round["number"], reverse=True)
    if data_for_all_rounds:
        if len(data_for_all_rounds) > 1:
            return data_for_all_rounds[1]["number"]
    return None


def get_data_for_round(country_data, roundNumber):
    data_for_all_rounds = sorted(country_data["rounds"], key=lambda round: round["number"], reverse=True)
    return next((round for round in data_for_all_rounds if round["number"] == roundNumber), {"data": {}})


def calculate_country_status(country_data, scope, roundNumber):
    if len(country_data.get("rounds", [])) == 0:
        # TODO put in an enum
        return "inScope"
    if scope.count() == 0:
        return "inScope"
    data_for_round = get_data_for_round(country_data, roundNumber)
    district_statuses = [
        determine_status_for_district(district_data)
        for district_data in data_for_round["data"].values()
        if district_data["district"] in [org_unit.id for org_unit in scope]
    ]
    aggregated_statuses = reduce(reduce_to_country_status, district_statuses, {})
    if aggregated_statuses.get("total", 0) == 0:
        return "inScope"
    passing_ratio = round((aggregated_statuses["passed"] * 100) / scope.count())
    if passing_ratio >= 80:
        return "1lqasOK"
    return "3lqasFail"


class LqasAfroViewset(ModelViewSet):
    def determine_reference_dates(self):
        start_date_after = self.request.GET.get("startDate", None)
        end_date_before = self.request.GET.get("endDate", None)
        selected_period = self.request.GET.get("period", None)
        if start_date_after is None and end_date_before is None and selected_period is None:
            selected_period = "6months"
        if selected_period is not None:
            if not selected_period[0].isdigit():
                raise ValueError("period should be 3months, 6months, 9months or 12months")
            end_date_before = None
            today = datetime.now()
            interval_in_months = int(selected_period[0])
            if selected_period[1].isdigit():
                interval_in_months = int(f"{selected_period[0]}{selected_period[1]}")
            start_date_after = (today - timedelta(days=interval_in_months * 31)).date()
        else:
            if start_date_after is not None:
                start_date_after = datetime.strptime(start_date_after, "%d-%m-%Y").date()
            if end_date_before is not None:
                end_date_before = datetime.strptime(end_date_before, "%d-%m-%Y").date()
        return start_date_after, end_date_before

    def filter_campaigns_by_date(self, campaigns, reference, reference_date):
        requested_round = self.request.GET.get("round", "latest")
        round_number_to_find = int(requested_round) if requested_round.isdigit() else None
        if requested_round != "penultimate":
            if reference == "start":
                return [
                    campaign
                    for campaign in campaigns
                    if campaign.find_last_round_with_date(reference, round_number_to_find) is not None
                    and campaign.find_last_round_with_date(reference, round_number_to_find).started_at >= reference_date
                ]
            if reference == "end":
                return [
                    campaign
                    for campaign in campaigns
                    if campaign.find_last_round_with_date(reference, round_number_to_find) is not None
                    and campaign.find_last_round_with_date(reference, round_number_to_find).ended_at <= reference_date
                ]
        else:
            if reference == "start":
                return [
                    campaign
                    for campaign in campaigns
                    if campaign.find_rounds_with_date(reference, round_number_to_find).count() > 1
                    and list(campaign.find_rounds_with_date(reference, round_number_to_find))[1].started_at
                    >= reference_date
                ]
            if reference == "end":
                return [
                    campaign
                    for campaign in campaigns
                    if campaign.find_rounds_with_date(reference, round_number_to_find).count() > 1
                    and list(campaign.find_rounds_with_date(reference, round_number_to_find))[1].ended_at
                    <= reference_date
                ]
