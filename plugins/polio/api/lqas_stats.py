import json
from django.core import cache
from rest_framework import viewsets
from django.http.response import HttpResponseBadRequest
from plugins.polio.models import Campaign
from plugins.polio.api.common import CACHE_VERSION, _build_district_cache, find_district, find_lqas_im_campaign
from django.utils.timezone import make_aware
from datetime import datetime
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from functools import lru_cache
from plugins.polio.models import Config
from collections import defaultdict
from iaso.models import OrgUnit
from plugins.polio.helpers import get_url_content


def format_caregiver_stats(campaign_stats):
    for campaign in campaign_stats.values():
        for round_stats in campaign["rounds"].values():
            for district in round_stats["data"].values():
                all_care_givers_stats = district["care_giver_stats"]
                sorted_care_givers_stats = {
                    key: all_care_givers_stats[key]
                    for key in sorted(all_care_givers_stats, key=all_care_givers_stats.get, reverse=True)
                }
                if "caregivers_informed" not in sorted_care_givers_stats.keys():
                    continue
                total_informed = sorted_care_givers_stats.pop("caregivers_informed")
                best_result_key = next(iter(sorted_care_givers_stats))
                best_result = sorted_care_givers_stats[best_result_key]
                caregivers_dict = defaultdict(float)
                caregivers_dict["caregivers_informed"] = total_informed
                for reason, count in sorted_care_givers_stats.items():
                    if count == best_result:
                        caregivers_dict[reason] = count
                ratio = (100 * best_result) / total_informed
                caregivers_dict["ratio"] = ratio
                children_checked = district["total_child_checked"]
                caregivers_informed_ratio = (100 * total_informed) / children_checked
                caregivers_dict["caregivers_informed_ratio"] = caregivers_informed_ratio
                district["care_giver_stats"] = caregivers_dict


def add_nfm_stats_for_rounds(campaign_stats, nfm_stats, kind: str):
    assert kind in ["nfm_stats", "nfm_abs_stats"]
    for campaign, stats in campaign_stats.items():
        for round_number, round_stats in stats["rounds"].items():
            for district, district_stats in round_stats["data"].items():
                if district_stats["total_child_checked"] == 60:
                    for reason, count in nfm_stats[campaign][round_number][district].items():
                        round_stats[kind][reason] += count
    return campaign_stats


class LQASStatsViewSet(viewsets.ViewSet):
    """
    Endpoint used to transform IM (independent monitoring) data from existing ODK forms stored in ONA.
    """

    def list(self, request):
        no_cache = request.GET.get("no_cache", "false") == "true"
        requested_country = request.GET.get("country_id", None)
        if requested_country is None:
            return HttpResponseBadRequest
        requested_country = int(requested_country)

        campaigns = Campaign.objects.filter(country_id=requested_country).filter(is_test=False).filter(deleted_at=None)
        if campaigns:
            latest_campaign_update = campaigns.latest("updated_at").updated_at
        else:
            latest_campaign_update = None

        cached_response = cache.get(
            "{0}-{1}-LQAS".format(request.user.id, request.query_params["country_id"]), version=CACHE_VERSION
        )

        if not request.user.is_anonymous and cached_response and not no_cache:
            response = json.loads(cached_response)
            cached_date = make_aware(datetime.utcfromtimestamp(response["cache_creation_date"]))
            if latest_campaign_update and cached_date > latest_campaign_update:
                return JsonResponse(response)

        config = get_object_or_404(Config, slug="lqas-config")
        skipped_forms_list = []
        no_round_count = 0
        unknown_round = 0
        skipped_forms = {"count": 0, "no_round": 0, "unknown_round": unknown_round, "forms_id": skipped_forms_list}

        find_lqas_im_campaign_cached = lru_cache(maxsize=None)(find_lqas_im_campaign)

        base_stats = lambda: {
            "total_child_fmd": 0,
            "total_child_checked": 0,
            "care_giver_stats": defaultdict(float),
            "total_sites_visited": 0,
        }
        round_stats = lambda: {
            "number": -1,
            "data": defaultdict(base_stats),
            "nfm_stats": defaultdict(int),
            "nfm_abs_stats": defaultdict(int),
        }
        campaign_stats = defaultdict(
            lambda: {
                "rounds": defaultdict(round_stats),
                "districts_not_found": [],
                "has_scope": False,
                # Submission where it says a certain round but the date place it in another round
                "bad_round_number": 0,
            }
        )

        # Storing all "reasons no finger mark" for each campaign in this dict
        # Campaign -> Round -> District -> reason -> count
        nfm_reasons_per_district_per_campaign = defaultdict(
            lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
        )
        # Same with reasons for absence
        nfm_abs_reasons_per_district_per_campaign = defaultdict(
            lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
        )
        form_count = 0
        form_campaign_not_found_count = 0
        day_country_not_found = defaultdict(lambda: defaultdict(int))
        caregiver_source_info_keys = [
            "TV",
            "Radio",
            "Others",
            "Gong_gong",
            "Mob_VanPA",
            "H2H_Mobilizer",
            "IEC_Materials",
            "Volunteers",
            "Health_worker",
            "Opinion_leader",
            "Com_Info_centre",
            "Religious_leader",
            "MobileMessaging_SocialMedia",
        ]
        if request.user.iaso_profile.org_units.count() == 0:
            authorized_countries = OrgUnit.objects.filter(org_unit_type_id__category="COUNTRY")
        else:
            authorized_countries = request.user.iaso_profile.org_units.filter(org_unit_type_id__category="COUNTRY")
        for country_config in config.content:
            country = OrgUnit.objects.get(id=country_config["country_id"])

            if country not in authorized_countries:
                continue

            if country.id != requested_country:
                continue

            districts_qs = (
                OrgUnit.objects.hierarchy(country)
                .filter(org_unit_type_id__category="DISTRICT")
                .filter(validation_status="VALID")
                .only("name", "id", "parent", "aliases")
                .prefetch_related("parent")
            )
            district_dict = _build_district_cache(districts_qs)

            forms = get_url_content(
                url=country_config["url"],
                login=country_config["login"],
                password=country_config["password"],
                minutes=country_config.get("minutes", 60 * 24 * 10),
            )
            debug_response = set()

            for form in forms:
                if "roundNumber" not in form:
                    skipped_forms_list.append({form["_id"]: {"round": None, "date": form.get("Date_of_LQAS", None)}})
                    no_round_count += 1
                    continue
                round_number_key = form["roundNumber"]
                if round_number_key.upper() == "MOPUP":
                    continue
                if round_number_key[-1].isdigit():
                    round_number = round_number_key[-1]
                else:
                    skipped_forms_list.append(
                        {form["_id"]: {"round": form["roundNumber"], "date": form.get("Date_of_LQAS", None)}}
                    )
                    unknown_round += 1
                    continue
                form_count += 1
                try:
                    today_string = form["today"]
                    today = datetime.strptime(today_string, "%Y-%m-%d").date()
                except KeyError:
                    skipped_forms_list.append(
                        {form["_id"]: {"round": form["roundNumber"], "date": form.get("Date_of_LQAS", None)}}
                    )
                    continue

                campaign = find_lqas_im_campaign_cached(campaigns, today, country, round_number, "lqas")

                if not campaign:
                    campaign = find_lqas_im_campaign_cached(campaigns, today, country, None, "lqas")
                    if campaign:
                        campaign_name = campaign.obr_name
                        campaign_stats[campaign_name]["bad_round_number"] += 1

                if not campaign:
                    day_country_not_found[country.name][today_string] += 1
                    form_campaign_not_found_count += 1
                    continue
                if form.get("Response", None) and campaign:
                    debug_response.add((campaign.obr_name, form["Response"]))
                campaign_name = campaign.obr_name
                total_sites_visited = 0
                total_Child_FMD = 0
                total_Child_Checked = 0
                caregiver_counts_dict = defaultdict(int)
                district_name = form.get("District", None)
                if not district_name:
                    district_name = form.get("district", None)
                region_name = form.get("Region")

                HH_COUNT = form.get("Count_HH", None)
                if HH_COUNT is None:
                    print("missing HH_COUNT", form)

                for HH in form.get("Count_HH", []):
                    total_sites_visited += 1
                    # check finger
                    Child_FMD = HH.get("Count_HH/FM_Child", 0)
                    Child_Checked = HH.get("Count_HH/Child_Checked", None)
                    if not Child_Checked:
                        Child_Checked = HH.get("Count_HH/Children_seen", 0)
                    if Child_FMD == "Y":
                        total_Child_FMD += 1
                    else:
                        reason = HH.get("Count_HH/Reason_Not_FM")
                        if reason and campaign and round_number:
                            nfm_reasons_per_district_per_campaign[campaign_name][round_number][district_name][
                                reason
                            ] += 1

                        if reason == "childabsent" and round_number:
                            reason_abs = HH.get("Count_HH/Reason_ABS_NFM", "unknown")
                            nfm_abs_reasons_per_district_per_campaign[campaign_name][round_number][district_name][
                                reason_abs
                            ] += 1
                    total_Child_Checked += int(Child_Checked)
                    # gather caregiver stats
                    caregiver_informed = HH.get("Count_HH/Care_Giver_Informed_SIA", 0)
                    caregiver_source_info = HH.get("Count_HH/Caregiver_Source_Info", None)
                    if caregiver_informed == "Y":
                        caregiver_counts_dict["caregivers_informed"] += 1

                    if isinstance(caregiver_source_info, str):
                        source_keys = caregiver_source_info.split()
                        for source_key in source_keys:
                            caregiver_counts_dict[source_key] += 1
                    else:
                        for source_info_key in caregiver_source_info_keys:
                            source_info = HH.get("Count_HH/Caregiver_Source_Info/" + source_info_key)
                            if source_info == "True":
                                caregiver_counts_dict[source_info_key] += 1
                # FIXME: We refetch the whole list for all submission this is probably a cause of slowness
                scope = campaign.get_districts_for_round_number(round_number).values_list("id", flat=True)
                campaign_stats[campaign_name]["has_scope"] = len(scope) > 0
                district = find_district(district_name, region_name, district_dict)
                if not district:
                    district_long_name = "%s - %s" % (district_name, region_name)

                    if district_long_name not in campaign_stats[campaign_name]["districts_not_found"]:
                        campaign_stats[campaign_name]["districts_not_found"].append(district_long_name)
                # Sending district info if it exists and either the district is in scope or there's no scope (in which case we send all info for all distrcits found)
                if district is not None and (district.id in scope or len(scope) == 0):
                    campaign_stats[campaign_name]["country_id"] = country.id
                    campaign_stats[campaign_name]["country_name"] = country.name
                    campaign_stats[campaign_name]["campaign"] = campaign
                    d = campaign_stats[campaign_name]["rounds"][round_number]["data"][district_name]

                    for key in caregiver_counts_dict:
                        d["care_giver_stats"][key] += caregiver_counts_dict[key]

                    d["total_child_fmd"] = d["total_child_fmd"] + total_Child_FMD
                    d["total_child_checked"] = (
                        d["total_child_checked"] + total_sites_visited
                    )  # ChildCehck always zero in Mali?
                    d["total_sites_visited"] = d["total_sites_visited"] + total_sites_visited
                    d["district"] = district.id
                    d["region_name"] = district.parent.name
        add_nfm_stats_for_rounds(campaign_stats, nfm_reasons_per_district_per_campaign, "nfm_stats")
        add_nfm_stats_for_rounds(campaign_stats, nfm_abs_reasons_per_district_per_campaign, "nfm_abs_stats")
        format_caregiver_stats(campaign_stats)

        skipped_forms.update(
            {"count": len(skipped_forms_list), "no_round": no_round_count, "unknown_round": unknown_round}
        )
        for campaign_stat in campaign_stats.values():
            # Ensure round that might not have data are present.
            campaign_stat_campaign = campaign_stat.get("campaign", None)
            if campaign_stat_campaign:
                for round in campaign_stat["campaign"].rounds.all():
                    # this actually make an entry thanks to the defaultdict
                    # noinspection PyStatementEffect
                    campaign_stat["rounds"][str(round.number)]
                del campaign_stat["campaign"]
            for round_number, round in campaign_stat["rounds"].items():
                round["number"] = int(round_number)
            campaign_stat["rounds"] = list(campaign_stat["rounds"].values())

        response = {
            "stats": campaign_stats,
            "form_count": form_count,
            "form_campaign_not_found_count": form_campaign_not_found_count,
            "day_country_not_found": day_country_not_found,
            "skipped_forms": skipped_forms,
            "cache_creation_date": datetime.utcnow().timestamp(),
        }

        if not request.user.is_anonymous:
            cache.set(
                "{0}-{1}-LQAS".format(request.user.id, request.query_params["country_id"]),
                json.dumps(response),
                3600,
                version=CACHE_VERSION,
            )
        return JsonResponse(response, safe=False)
