import json
from collections import defaultdict
from datetime import timedelta
from enum import Enum
from functools import reduce
from logging import getLogger
from typing import Optional

import pandas as pd
import requests
from django.utils.timezone import now

from plugins.polio.models import Round, URLCache

logger = getLogger(__name__)

CACHE_VERSION = 7


def _build_district_cache(districts_qs):
    district_dict = defaultdict(list)
    for f in districts_qs:
        district_dict[f.name.lower().strip()].append(f)
        if f.aliases:
            for alias in f.aliases:
                district_dict[alias.lower().strip()].append(f)
    return district_dict


def lqasim_day_in_round(current_round, today, kind, campaign, country):
    lqas_im_start = kind + "_started_at"
    lqas_im_end = kind + "_ended_at"
    reference_start_date = current_round.started_at
    reference_end_date = current_round.ended_at
    if current_round.get_item_by_key(lqas_im_start):
        # What if IM start date is after round end date?
        reference_start_date = current_round.get_item_by_key(lqas_im_start)
    if current_round.get_item_by_key(lqas_im_end):
        reference_end_date = current_round.get_item_by_key(lqas_im_end)
    if not reference_end_date and not reference_start_date:
        return False
    # Temporary answer to question above
    if reference_end_date <= reference_start_date:
        reference_end_date = reference_start_date + timedelta(days=+10)
    if campaign.country_id == country.id and reference_start_date <= today <= reference_end_date:
        return True
    return False


def find_lqas_im_campaign(campaigns, today, country, round_number: Optional[int], kind):
    if not today:
        return None
    for campaign in campaigns:
        if round_number is not None:
            try:
                current_round = campaign.rounds.get(number=round_number)
            except Round.DoesNotExist:
                continue
            if lqasim_day_in_round(current_round, today, kind, campaign, country):
                return campaign
        else:
            for current_round in campaign.rounds.all():
                if lqasim_day_in_round(current_round, today, kind, campaign, country):
                    return campaign

    return None


def find_campaign_on_day(campaigns, day, response_id=None):
    exact_match = campaigns.filter(obr_name=response_id).first()
    if exact_match:
        return exact_match
    for c in campaigns:
        if not c.start_date:
            continue
        start_date = c.start_date
        end_date = c.end_date
        if not end_date or end_date < c.last_start_date:
            end_date = c.last_start_date + timedelta(days=+28)
        else:
            end_date = end_date + timedelta(days=+10)
        if start_date <= day < end_date:
            return c


def convert_dicts_to_table(list_of_dicts):
    keys = set()
    for d in list_of_dicts:
        keys.update(set(d.keys()))
    keys = list(keys)
    keys.sort()
    values = [keys]

    for d in list_of_dicts:
        l = []
        for k in keys:
            l.append(d.get(k, None))
        values.append(l)

    return values


def find_district(district_name, region_name, district_dict):
    district_name_lower = district_name.lower() if district_name else None
    district_list = district_dict.get(district_name_lower)
    if district_list and len(district_list) == 1:
        return district_list[0]
    elif district_list and len(district_list) > 1:
        for di in district_list:
            parent_aliases_lower = [alias.lower().strip() for alias in di.parent.aliases] if di.parent.aliases else []
            if di.parent.name.lower().strip() == region_name.lower().strip() or (
                di.parent.aliases and region_name.lower().strip() in parent_aliases_lower
            ):
                return di
    return None


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
            if "?" in url:
                paginated_url = url + f"&page={page}&page_size=10000"
            else:
                paginated_url = url + f"?page={page}&page_size=10000"

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


def determine_status_for_district(district_data):
    if not district_data:
        return LQASStatus.InScope
    checked = district_data["total_child_checked"]
    marked = district_data["total_child_fmd"]
    if checked == 60:
        if marked > 56:
            return LQASStatus.Pass
    return LQASStatus.Fail


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


def get_data_for_round(country_data, roundNumber):
    data_for_all_rounds = sorted(country_data["rounds"], key=lambda round: round["number"], reverse=True)
    return next((round for round in data_for_all_rounds if round["number"] == roundNumber), {"data": {}})


def calculate_country_status(country_data, scope, roundNumber):
    if len(country_data.get("rounds", [])) == 0:
        # TODO put in an enum
        return LQASStatus.InScope
    if len(scope) == 0:
        return LQASStatus.InScope
    data_for_round = get_data_for_round(country_data, roundNumber)
    district_statuses = [
        determine_status_for_district(district_data)
        for district_data in data_for_round["data"].values()
        if district_data["district"] in [org_unit.id for org_unit in scope]
    ]
    aggregated_statuses = reduce(reduce_to_country_status, district_statuses, {})
    if aggregated_statuses.get("total", 0) == 0:
        return LQASStatus.InScope
    passing_ratio = round((aggregated_statuses["passed"] * 100) / len(scope))
    if passing_ratio >= 80:
        return LQASStatus.Pass
    return LQASStatus.Fail


# Using this custom function because Polygon.from_bbox will change the bounding box if the longitude coordinates cover more than 180°
# which will cause hard to track bugs
# This very plain solution required investigation from 3 people and caused the utterance of many curse words.
def make_safe_bbox(x_min, y_min, x_max, y_max):
    return ((x_min, y_min), (x_max, y_min), (x_max, y_max), (x_min, y_max), (x_min, y_min))


class RoundSelection(str, Enum):
    Latest = "latest"
    Penultimate = "penultimate"


class LQASStatus(str, Enum):
    Pass = "1lqasOK"
    Fail = "3lqasFail"
    InScope = "inScope"


def find_orgunit_in_cache(cache_dict, name, parent_name=None):
    if not name or pd.isna(name):
        return None
    name = name.lower().strip()
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
    # if no match found on parent, use the first since we put them before the aliases
    return matched_orgunits[0]


def make_orgunits_cache(orgunits):
    cache_dict = defaultdict(list)
    for f in orgunits:
        cache_dict[f.name.lower().strip()].append(f)
    for f in orgunits:
        if f.aliases:
            for a in f.aliases:
                if not f.name.lower().strip() == a.lower().strip():
                    cache_dict[a.lower().strip()].append(f)
    return cache_dict
