"Summary for dashboard"
from datetime import date, timedelta
from logging import getLogger

from django.core.cache import cache
from gspread.utils import extract_id_from_url  # type: ignore

from plugins.polio.models import SpreadSheetImport, Round, Campaign
from plugins.polio.preparedness.calculator import avg
from plugins.polio.preparedness.parser import get_preparedness, indicators

logger = getLogger(__name__)


def get_summary(zones):
    r = {}
    for _, i, _, kind in indicators:
        name_values = [(dn, d.get(i)) for dn, d in zones.items()]
        values = [value for _, value in name_values]
        if kind == "number" or kind == "percent":
            r[i] = avg(values)
        elif kind == "date":
            values = [v for v in values if v]

            r[i] = (len(values) / len(zones) * 10) if zones else None
    return r


def preparedness_summary(prep_dict):
    r = {}
    indicators_per_zone = {
        "national": prep_dict["national"],
        "regions": get_summary(prep_dict["regions"]),
        "districts": get_summary(prep_dict["districts"]),
    }
    # get average
    r["overall_status_score"] = avg(
        [
            indicators_per_zone["national"]["status_score"],
            indicators_per_zone["regions"]["status_score"],
            indicators_per_zone["districts"]["status_score"],
        ]
    )

    def format_indicator(value, kind):
        if kind == "percent":
            return value / 10 if value else value
        return value

    # pivot
    r["indicators"] = {}
    for sn, key, title, kind in indicators:
        r["indicators"][key] = {
            "sn": sn,
            "key": key,
            "title": title,
            "national": format_indicator(indicators_per_zone["national"][key], kind),
            "regions": format_indicator(indicators_per_zone["regions"][key], kind),
            "districts": format_indicator(indicators_per_zone["districts"][key], kind),
        }
    return r


DAYS_EVOLUTION = [
    # day before, target in percent
    (1, 90),
    (3, 85),
    (7, 80),
    (14, 60),
    (21, 40),
    (28, 20),
]


def score_for_x_day_before(ssi_for_campaign, ref_date: date, n_day: int):
    day = ref_date - timedelta(days=n_day)
    try:
        ssi = ssi_for_campaign.filter(created_at__date=day).last()
    except SpreadSheetImport.DoesNotExist:
        return None, day, None
    try:
        preparedness = get_preparedness(ssi.cached_spreadsheet)
        summary = preparedness_summary(preparedness)
        score = summary["overall_status_score"]
    except Exception:
        return None, day, None
    return ssi.created_at, day, score


def history_for_campaign(ssi_qs, round: Round):
    ref_date = round.started_at
    if not ref_date:
        return {"error": f"Please configure a start date for the round {round}"}
    r = []
    for n_day, target in DAYS_EVOLUTION:
        sync_time, day, score = score_for_x_day_before(ssi_qs, ref_date, n_day)
        r.append(
            {
                "days_before": n_day,
                "expected_score": target,
                "preparedness_score": score,
                "date": day,
                "sync_time": sync_time,
            }
        )
    return r


def _make_prep(c: Campaign, round: Round):
    logger.info(f"Make prep called for round {round} - {c}")
    url = round.preparedness_spreadsheet_url
    if not url:
        return None
    campaign_prep = {
        "campaign_id": c.id,
        "campaign_obr_name": c.obr_name,
        "indicators": {},
        "round": f"Round{round.number}",
        "round_number": round.number,
        "round_id": round.id,
        "round_start": round.started_at,
        "round_end": round.ended_at,
    }
    try:
        spread_id = extract_id_from_url(url)
        ssi_qs = SpreadSheetImport.objects.filter(spread_id=spread_id)
        last_ssi = ssi_qs.last()
        if not ssi_qs or not last_ssi:
            # No import yet
            campaign_prep["status"] = "not_sync"
            campaign_prep["details"] = "This spreadsheet has not been synchronised yet"
            return campaign_prep
        campaign_prep["date"] = last_ssi.created_at
        cs = last_ssi.cached_spreadsheet
        last_p = get_preparedness(cs)
        campaign_prep.update(preparedness_summary(last_p))
        if round.number != last_p["national"]["round"]:
            logger.info(f"Round mismatch on {c} {round}")

        campaign_prep["history"] = history_for_campaign(ssi_qs, round)
    except Exception as e:  # FIXME: too broad Exception
        campaign_prep["status"] = "error"
        campaign_prep["details"] = str(e)
        logger.exception(e)
    return campaign_prep


TIMEOUT_PREPAREDNESS = 60 * 60 * 24
"set as 24h since we run the cron once per day"


def set_preparedness_cache_for_round(round):
    prep = _make_prep(round.campaign, round)
    cache.set(
        f"preparedness-{round.id}",
        value=prep,
        timeout=TIMEOUT_PREPAREDNESS,
    )
    return prep


def get_or_set_preparedness_cache_for_round(campaign, round):
    p = cache.get_or_set(
        f"preparedness-{round.id}",
        default=lambda: _make_prep(campaign, round),
        timeout=TIMEOUT_PREPAREDNESS,
    )
    return p
