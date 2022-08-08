from collections import defaultdict
from datetime import timedelta
from functools import lru_cache

import pandas as pd
from django.http import HttpResponse
from pandas import DataFrame
from rest_framework import viewsets
from rest_framework.decorators import action

from iaso.models import *
from plugins.polio.helpers import get_url_content
from plugins.polio.models import Campaign
from plugins.polio.models import Config

from logging import getLogger

logger = getLogger(__name__)


def forma_find_campaign_on_day(campaigns, day, country):
    """Guess campaign from formA submission

    FormA Submission are still considered on time 28 days after the round end at the campaign level
    So we are quite lenient on dates
    """

    for c in campaigns:
        earliest_round = c.rounds.filter(started_at__isnull=False).order_by("started_at").first()
        if not earliest_round:
            continue
        start_date = earliest_round.started_at
        latest_round_start = c.rounds.filter(started_at__isnull=False).order_by("started_at").last()
        if not latest_round_start:
            continue  # should not happen if we have an earliest_round?
        latest_round_end = c.rounds.filter(ended_at__isnull=False).order_by("ended_at").last()
        end_date = None
        if latest_round_end:
            end_date = latest_round_end.ended_at

        if not end_date:
            end_date = latest_round_start.started_at
        else:
            if latest_round_start.started_at > end_date:
                end_date = latest_round_start.started_at
        end_date = end_date + timedelta(days=+60)
        if c.country_id == country.id and start_date <= day < end_date:
            return c
    return None


def find_orgunit_in_cache(cache_dict, name, parent_name=None):
    if not name or pd.isna(name):
        return None
    name = name.lower()
    parent_name = parent_name.lower() if (parent_name and not pd.isna(parent_name)) else ""
    matched_orgunits = cache_dict[name]

    if len(matched_orgunits) == 0:
        return
    if len(matched_orgunits) == 1:
        return matched_orgunits[0]
    for f in matched_orgunits:
        if f.parent.name.lower() == parent_name:
            return f
        if f.parent.aliases:
            aliases = [alias.lower() for alias in f.parent.aliases]
            if parent_name in aliases:
                return f
    # if can't match on parent, use the first since we put them before the aliases
    return matched_orgunits[0]


def make_orgunits_cache(orgunits):
    cache_dict = defaultdict(list)
    for f in orgunits:
        cache_dict[f.name.lower()].append(f)
    for f in orgunits:
        if f.aliases:
            for a in f.aliases:
                if not f.name.lower() == a.lower():
                    cache_dict[a.lower()].append(f)
    return cache_dict


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
    )
    facilities = (
        OrgUnit.objects.filter(parent__in=districts)
        .prefetch_related("parent")
        .prefetch_related("parent__parent")
        .prefetch_related("parent__parent__parent")
    )
    regions = (
        OrgUnit.objects.filter(parents_q(districts))
        .filter(path__depth=2)
        .prefetch_related("parent")
        .prefetch_related("parent__parent")
        .prefetch_related("parent__parent__parent")
    )
    countries = (
        OrgUnit.objects.filter(parents_q(districts))
        .filter(path__depth=1)
        .prefetch_related("parent")
        .prefetch_related("parent__parent")
        .prefetch_related("parent__parent__parent")
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
    if not campaign.get_all_districts().count() > 0:
        # print(f"skipping {cs}, no scope")
        return

    if not campaign_find_func.get(campaign.pk):
        campaign_find_func[campaign.pk] = make_find_orgunit_for_campaign(campaign)
    return campaign_find_func[campaign.pk](*args)


def handle_country(forms, country, campaign_qs) -> DataFrame:
    """For each submission try to match the Zone with a campaign and a matching orgunit in scope"""

    # Cache for orgunits per campaign
    cache_campaign_find_func = {}

    df = DataFrame.from_records(forms)

    df["today"] = pd.to_datetime(df["today"])
    if "District" not in df.columns:
        df["District"] = None
    if "facility" not in df.columns:
        df["facility"] = None

    df["country_config_id"] = country.id
    df["country_config_name"] = country.name
    df["country_config"] = country
    print("Matching country", country)
    forma_find_campaign_on_day_cached = lru_cache(maxsize=None)(forma_find_campaign_on_day)
    df["campaign"] = df.apply(lambda r: forma_find_campaign_on_day_cached(campaign_qs, r["today"], country), axis=1)
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
    # Not removing duplicate here, we do it in PowerBi so we can debug probleme there
    # df = df.sort_values("endtime").drop_duplicates(['Region', 'District', 'facility', 'roundNumber', 'Admin_LvL_Rpt'])
    return df


def get_content_for_config(config):
    return get_url_content(
        url=config["url"], login=config["login"], password=config["password"], minutes=config.get("minutes", 120)
    )


def fetch_and_match_forma_data():

    conf = Config.objects.get(slug="forma")
    campaign_qs = Campaign.objects.filter(deleted_at=None).all().prefetch_related("rounds").prefetch_related("country")

    dfs = []
    for config in conf.content:
        try:
            submissions = get_content_for_config(config)
            country = OrgUnit.objects.get(id=config["country_id"])
            compaigns_of_country = campaign_qs.filter(country_id=config["country_id"])
            df = handle_country(submissions, country, compaigns_of_country)
            dfs.append(df)
        except Exception:
            logger.exception(f"Error handling forma data for country {config.get('country', conf)}")

    concatened_df = pd.concat(dfs)
    return concatened_df


def get_forma_scope_df(campaigns):
    scope_dfs = []
    for campaign in campaigns:
        districts = campaign.get_all_districts()
        if districts.count() == 0:
            logger.info(f"skipping {campaign}, no scope")
            continue
        facilities = OrgUnit.objects.filter(parent__in=districts)
        regions = OrgUnit.objects.filter(parents_q(districts)).filter(path__depth=2)
        countries = OrgUnit.objects.filter(parents_q(districts)).filter(path__depth=1)

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
            print(campaign, scope_df.shape)
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
        campaigns = Campaign.objects.filter(deleted_at=None).all()
        r = get_forma_scope_df(campaigns).to_json(orient="table")
        return HttpResponse(r, content_type="application/json")

    def list(self, request):
        df = fetch_and_match_forma_data()
        # Need to drop all the Django orm object, since Panda can't serialize them
        df = df.drop(["ou", "report_org_unit", "country_config", "campaign"], axis=1)
        if request.GET.get("format", None) == "csv":
            r = df.to_csv()
            return HttpResponse(r, content_type="text/csv")
        else:
            r = df.to_json(orient="table")
            return HttpResponse(r, content_type="application/json")
