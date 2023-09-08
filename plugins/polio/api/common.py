from collections import defaultdict
from datetime import timedelta
from typing import Optional
from plugins.polio.models import Round

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


def find_campaign_on_day(campaigns, day):
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
