import operator
from datetime import date, timedelta, datetime
from functools import lru_cache, reduce
from logging import getLogger
from typing import Any, Callable, Dict, Optional
from uuid import UUID

import pandas as pd
from django.core.cache import cache
from django.db.models import Max, Min, Q
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from pandas import DataFrame
from rest_framework import viewsets
from rest_framework.decorators import action

from iaso.api.common import CONTENT_TYPE_CSV
from iaso.models import OrgUnit
from plugins.polio.api.common import find_orgunit_in_cache, get_url_content, make_orgunits_cache
from plugins.polio.api.dashboards.vaccine_stocks import handle_ona_request_with_key
from plugins.polio.models import Campaign, Config

logger = getLogger(__name__)


def forma_find_campaign_on_day(campaigns, day):
    """Guess campaign from formA submission

    FormA Submission are still considered on time 28 days after the round end at the campaign level
    So we are quite lenient on dates
    """
    for c in campaigns:
        start_date = c.start_date
        if not start_date:
            continue
        end_date = c.end_date
        if not end_date or end_date < c.last_start_date:
            end_date = c.last_start_date

        end_date = end_date + timedelta(days=+60)
        if start_date <= day < end_date:
            return c
    return None


def parents_q(org_units):
    """Create Q query object for all the parents for all the org units present

    This fix the problem in django query that it would otherwise only give the intersection
    """
    if not org_units:
        return Q(pk=None)

    queries = [Q(path__ancestors=org_unit.path) for org_unit in org_units]
    q = reduce(operator.or_, queries)
    return q


def make_find_orgunit_for_campaign(cs):
    districts = (
        cs.get_all_districts()
        .prefetch_related("parent")
        .prefetch_related("parent__parent")
        .prefetch_related("parent__parent__parent")
        .prefetch_related("org_unit_type")
    )
    facilities = (
        OrgUnit.objects.filter(parent__in=districts)
        .prefetch_related("parent")
        .prefetch_related("parent__parent")
        .prefetch_related("parent__parent__parent")
        .prefetch_related("org_unit_type")
    )
    regions = (
        OrgUnit.objects.filter(parents_q(districts))
        .filter(path__depth=2)
        .prefetch_related("parent")
        .prefetch_related("parent__parent")
        .prefetch_related("parent__parent__parent")
        .prefetch_related("org_unit_type")
    )
    countries = (
        OrgUnit.objects.filter(parents_q(districts))
        .filter(path__depth=1)
        .prefetch_related("parent")
        .prefetch_related("parent__parent")
        .prefetch_related("parent__parent__parent")
        .prefetch_related("org_unit_type")
    )
    logger.info(
        f"Creating cache for {cs}: Facilities, {facilities.count()}; regions, {regions.count()}, countries, {countries.count()}"
    )
    districts_cache = make_orgunits_cache(districts)
    facilities_cache = make_orgunits_cache(facilities)
    regions_cache = make_orgunits_cache(regions)
    countries_cache = make_orgunits_cache(countries)

    def find_orgunit(country, region, district, facility):
        if facility and not pd.isna(facility):
            return find_orgunit_in_cache(facilities_cache, facility, district)
        if district and not pd.isna(district):
            return find_orgunit_in_cache(districts_cache, district, facility)
        if region and not pd.isna(region):
            return find_orgunit_in_cache(regions_cache, region, district)
        if country and not pd.isna(country):
            return find_orgunit_in_cache(countries_cache, country)

    return find_orgunit


def find_campaign_orgunits(campaign_find_func, campaign, *args):
    if pd.isna(campaign):
        return
    if not campaign_find_func.get(campaign.pk):
        if not campaign.get_all_districts().count() > 0:
            campaign_find_func[campaign.pk] = lambda *x: None
        campaign_find_func[campaign.pk] = make_find_orgunit_for_campaign(campaign)
    return campaign_find_func[campaign.pk](*args)


def handle_country(forms, country: OrgUnit, campaign_qs) -> DataFrame:
    """For each submission try to match the Zone with a campaign and a matching orgunit in scope"""

    # Cache for orgunits per campaign
    cache_campaign_find_func: Dict[UUID, Callable[[Any], Any]] = {}

    df = DataFrame.from_records(forms)
    # Add fields to speed up detection of campaign day
    campaign_qs = campaign_qs.filter(country_id=country.id).annotate(
        last_start_date=Max("rounds__started_at"),
        start_date=Min("rounds__started_at"),
        end_date=Max("rounds__ended_at"),
    )

    df["today"] = pd.to_datetime(df["today"])
    if "District" not in df.columns:
        df["District"] = None
    if "Region" not in df.columns:
        df["Region"] = None
    if "facility" not in df.columns:
        df["facility"] = None

    df["country_config_id"] = country.id
    df["country_config_name"] = country.name
    df["country_config"] = country
    logger.info(f"Matching country  {country} DF: {df.shape}")

    forma_find_campaign_on_day_cached = lru_cache(maxsize=None)(forma_find_campaign_on_day)
    df["campaign"] = df.apply(lambda r: forma_find_campaign_on_day_cached(campaign_qs, r["today"]), axis=1)
    df["campaign_id"] = df["campaign"].apply(lambda c: str(c.id) if c else None)
    df["campaign_obr_name"] = df["campaign"].apply(lambda c: c.obr_name if c else None)

    df["ou"] = df.apply(
        lambda r: find_campaign_orgunits(
            cache_campaign_find_func, r["campaign"], r["country_config_name"], r["Region"], r["District"], r["facility"]
        ),
        axis=1,
    )

    df["org_unit_id"] = df.apply(lambda r: r["ou"].id if r["ou"] else None, axis=1)
    df["org_unit_name"] = df.apply(lambda r: r["ou"].name if r["ou"] else None, axis=1)
    df["org_unit_type"] = df.apply(lambda r: r["ou"].org_unit_type if r["ou"] else None, axis=1)

    df["Admin Sub-District"] = df.apply(lambda r: r["facility"] if r["Admin_LvL_Rpt"] == "Sub-District" else "", axis=1)
    df["Admin District"] = df.apply(
        lambda r: r["District"] if r["Admin_LvL_Rpt"] in ("Sub-District", "District") else "", axis=1
    )
    df["Admin Region"] = df.apply(
        lambda r: r["Region"] if r["Admin_LvL_Rpt"] in ("Sub-District", "District", "Regional") else "", axis=1
    )
    df["report_org_unit"] = df.apply(
        lambda r: find_campaign_orgunits(
            cache_campaign_find_func,
            r["campaign"],
            r["country_config_name"],
            r["Admin Region"],
            r["Admin District"],
            r["Admin Sub-District"],
        ),
        axis=1,
    )
    df["report_org_unit_id"] = df.apply(lambda r: r["report_org_unit"].id if r["report_org_unit"] else None, axis=1)
    df["report_org_unit_name"] = df.apply(lambda r: r["report_org_unit"].name if r["report_org_unit"] else None, axis=1)
    # Not removing duplicate here, we do it in PowerBi so we can debug problems there
    # df = df.sort_values("endtime").drop_duplicates(['Region', 'District', 'facility', 'roundNumber', 'Admin_LvL_Rpt'])
    return df


def get_content_for_config(config, prefer_cache):
    return get_url_content(
        url=config["url"],
        login=config["login"],
        password=config["password"],
        minutes=config.get("minutes", 120),
        prefer_cache=prefer_cache,
    )


def fetch_and_match_forma_data(country_id=None):
    conf = Config.objects.get(slug="forma")
    campaign_qs = Campaign.objects.filter(deleted_at=None).all().prefetch_related("rounds").prefetch_related("country")

    dfs = []
    for config in conf.content:
        cid = int(country_id) if country_id and country_id.isdigit() else None
        if country_id is not None and config.get("country_id", None) != cid:
            continue
        try:
            country = OrgUnit.objects.get(id=config["country_id"])

            campaigns_of_country = campaign_qs.filter(country_id=config["country_id"]).annotate(
                last_start_date=Max("rounds__started_at"),
                start_date=Min("rounds__started_at"),
                end_date=Max("rounds__ended_at"),
            )
            # If all the country's campaigns has been over for more than 2 months, don't fetch submission from remote server
            # use cache. (FormA is after campaign so the delay is longer)
            last_campaign_date_agg = campaigns_of_country.aggregate(last_date=Max("end_date"))
            last_campaign_date: Optional[date] = last_campaign_date_agg["last_date"]
            prefer_cache = last_campaign_date and last_campaign_date + timedelta(days=60) < (date.today())
            submissions = get_content_for_config(config, prefer_cache)
            df = handle_country(submissions, country, campaigns_of_country)
            dfs.append(df)
        except Exception:
            logger.exception(f"Error handling forma data for country {config.get('country', conf)}")

    concatened_df = pd.concat(dfs)
    return concatened_df


def get_forma_scope_df(campaigns):
    scope_dfs = []
    one_year_ago = datetime.datetime.utcnow() - datetime.timedelta(weeks=52)
    for campaign in campaigns:
        for round in campaign.rounds.filter(started_at__gte=one_year_ago):
            districts = campaign.get_districts_for_round(round)

            if districts.count() == 0:
                logger.info(f"skipping {campaign}, no scope")
                continue
            facilities = OrgUnit.objects.filter(parent__in=districts).filter(validation_status="VALID")
            regions = (
                OrgUnit.objects.filter(parents_q(districts)).filter(path__depth=2).filter(validation_status="VALID")
            )
            countries = (
                OrgUnit.objects.filter(parents_q(districts)).filter(path__depth=1).filter(validation_status="VALID")
            )

            for ous in [districts, facilities, regions, countries]:
                scope_df = DataFrame.from_records(
                    ous.values(
                        "name",
                        "id",
                        "parent",
                        "parent__name",
                        "parent__parent__name",
                        "parent__parent_id",
                        "parent__parent__parent__name",
                        "parent__parent__parent_id",
                        "org_unit_type__name",
                    )
                )
                if scope_df.shape == (0, 0):
                    continue

                scope_df.columns = [
                    "name",
                    "id",
                    "parent_name",
                    "parent_id",
                    "parent2_name",
                    "parent2_id",
                    "parent3_name",
                    "parent3_id",
                    "type",
                ]
                scope_df["campaign_id"] = str(campaign.id)
                scope_df["campaign_obr_name"] = str(campaign.obr_name)
                scope_df["round_number"] = str(round.number)
                scope_dfs.append(scope_df)

    all_scopes = pd.concat(scope_dfs)
    return all_scopes


class FormAStocksViewSetV2(viewsets.ViewSet):
    """
    Endpoint used to transform Vaccine Stocks data from existing ODK forms stored in ONA.
    for display in PowerBI
    """

    @action(detail=False)
    def scopes(self, request):
        country = request.GET.get("country", "")
        cache_key = "form_a_scopes%s" % country
        r = cache.get(cache_key)
        if not r:
            campaigns = Campaign.objects.filter(deleted_at=None).all()
            if country:
                campaigns = campaigns.filter(country_id=country)
            if len(campaigns) == 0:
                r = "{}"
            else:
                r = get_forma_scope_df(campaigns).to_json(orient="table")
            cache.set(cache_key, r, 60 * 60)

        return HttpResponse(r, content_type="application/json")

    @method_decorator(cache_page(60 * 60 * 1))  # cache result for one hour
    def list(self, request):
        df = fetch_and_match_forma_data()
        # Need to drop all the Django orm object, since Panda can't serialize them
        df = df.drop(["ou", "report_org_unit", "country_config", "campaign"], axis=1)
        if request.GET.get("format", None) == "csv":
            r = df.to_csv()
            return HttpResponse(r, content_type=CONTENT_TYPE_CSV)
        else:
            r = df.to_json(orient="table")
            return HttpResponse(r, content_type="application/json")

    @method_decorator(cache_page(60 * 60 * 1))  # cache result for one hour
    def retrieve(self, request, pk):
        df = fetch_and_match_forma_data(country_id=pk)
        # Need to drop all the Django orm object, since Panda can't serialize them
        df = df.drop(["ou", "report_org_unit", "country_config", "campaign"], axis=1)
        if request.GET.get("format", None) == "csv":
            r = df.to_csv()
            return HttpResponse(r, content_type=CONTENT_TYPE_CSV)
        else:
            r = df.to_json(orient="table")
            return HttpResponse(r, content_type="application/json")


class FormAStocksViewSet(viewsets.ViewSet):
    """
    Endpoint used to transform Vaccine Stocks data from existing ODK forms stored in ONA.
    sample config: [{"url": "https://afro.who.int/api/v1/data/yyy", "login": "d", "country": "hyrule", "password": "zeldarules", "country_id": 2115781}]
    """

    def list(self, request):
        return handle_ona_request_with_key(request, "forma")
