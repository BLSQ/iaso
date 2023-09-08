import json
from collections import defaultdict
from datetime import datetime
from functools import lru_cache

from django.core.cache import cache
from django.http import JsonResponse
from django.http.response import HttpResponseBadRequest
from django.shortcuts import get_object_or_404
from django.utils.timezone import make_aware
from rest_framework import viewsets

from iaso.models import OrgUnit
from plugins.polio.api.common import CACHE_VERSION, _build_district_cache, find_district, find_lqas_im_campaign
from plugins.polio.helpers import get_url_content
from plugins.polio.models import Campaign, Config


class IMStatsViewSet(viewsets.ViewSet):
    """
           Endpoint used to transform IM (independent monitoring) data from existing ODK forms stored in ONA. Very custom to the polio project.

    sample Config:

    configs = [
           {
               "keys": {"roundNumber": "roundNumber",
                       "Response": "Response",
                },
               "prefix": "OHH",
               "url": 'https://brol.com/api/v1/data/5888',
               "login": "qmsdkljf",
               "password": "qmsdlfj"
           },
           {
               "keys": {'roundNumber': "roundNumber",
                       "Response": "Response",
                },
               "prefix": "HH",
               "url":  'https://brol.com/api/v1/data/5887',
               "login": "qmsldkjf",
               "password": "qsdfmlkj"
           }
       ]
    """

    def list(self, request):
        requested_country = request.GET.get("country_id", None)
        no_cache = request.GET.get("no_cache", "false") == "true"

        if requested_country is None:
            return HttpResponseBadRequest

        requested_country = int(requested_country)

        campaigns = Campaign.objects.filter(country_id=requested_country).filter(is_test=False)

        if campaigns:
            latest_campaign_update = campaigns.latest("updated_at").updated_at
        else:
            latest_campaign_update = None

        stats_types = request.GET.get("type", "HH,OHH")

        im_request_type = stats_types

        if stats_types == "HH,OHH":
            im_request_type = ""

        cached_response = cache.get(
            "{0}-{1}-IM{2}".format(request.user.id, request.query_params["country_id"], im_request_type),
            version=CACHE_VERSION,
        )

        if not request.user.is_anonymous and cached_response and not no_cache:
            response = json.loads(cached_response)
            cached_date = make_aware(datetime.utcfromtimestamp(response["cache_creation_date"]))

            if latest_campaign_update and cached_date > latest_campaign_update:
                return JsonResponse(response)

        stats_types = stats_types.split(",")
        config = get_object_or_404(Config, slug="im-config")
        skipped_forms_list = []
        no_round_count = 0
        unknown_round = 0
        skipped_forms = {"count": 0, "no_round": 0, "unknown_round": unknown_round, "forms_id": skipped_forms_list}
        find_lqas_im_campaign_cached = lru_cache(maxsize=None)(find_lqas_im_campaign)
        form_count = 0
        fully_mapped_form_count = 0
        base_stats = lambda: {"total_child_fmd": 0, "total_child_checked": 0, "total_sites_visited": 0}
        make_round_stats = lambda: {
            "number": -1,
            "data": defaultdict(base_stats),
            "nfm_stats": defaultdict(int),
            "nfm_abs_stats": defaultdict(int),
        }
        campaign_stats = defaultdict(
            lambda: {
                "rounds": defaultdict(make_round_stats),
                "districts_not_found": [],
                "has_scope": False,
                # Submission where it says a certain round but the date place it in another round
                "bad_round_number": 0,
            }
        )
        day_country_not_found = defaultdict(lambda: defaultdict(int))
        form_campaign_not_found_count = 0
        nfm_reason_keys = [
            "Tot_child_Absent_HH",
            "Tot_child_NC_HH",
            "Tot_child_NotVisited_HH",
            "Tot_child_NotRevisited_HH",
            "Tot_child_Asleep_HH",
            "Tot_child_Others_HH",
            "Tot_child_VaccinatedRoutine",
        ]
        nfm_reason_abs_keys = [
            "Tot_child_Abs_Parent_Absent",
            "Tot_child_Abs_Social_event",
            "Tot_child_Abs_Travelling",
            "Tot_child_Abs_Play_areas",
            "Tot_child_Abs_School",
            "Tot_child_Abs_Market",
            "Tot_child_Abs_Other",
            "Tot_child_Abs_Farm",
        ]
        # Ugly fix to exclude forms known to have data so terrible it breaks the results
        excluded_forms = [
            "2399548d-545e-4182-a3a0-54da841bc179",
            "59ca0419-798d-40ca-b690-460063329938",
            "ec93a59a-b354-4f9d-8240-f2a05c24479e",
        ]

        if request.user.iaso_profile.org_units.count() == 0:
            authorized_countries = OrgUnit.objects.filter(org_unit_type_id__category="COUNTRY")
        else:
            authorized_countries = request.user.iaso_profile.org_units.filter(org_unit_type_id__category="COUNTRY")

        for country_config in config.content:
            if country_config["country_id"] != requested_country:
                continue
            country = OrgUnit.objects.get(id=country_config["country_id"])
            if country not in authorized_countries:
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
                country_config["url"],
                country_config["login"],
                country_config["password"],
                minutes=country_config.get("minutes", 60 * 24 * 10),
            )
            debug_response = set()
            for form in forms:
                form_count += 1
                total_sites_visited = 0
                total_Child_FMD = 0
                total_Child_Checked = 0
                nfm_counts_dict = defaultdict(int)
                nfm_abs_counts_dict = defaultdict(int)
                done_something = False
                if isinstance(form, str):
                    print("wrong form format:", form, "in", country.name)
                    continue
                try:
                    round_number = form.get("roundNumber", None)
                    if round_number is None:
                        round_number = form.get("HH", [{}])[0]["HH/roundNumber"]
                    if round_number.upper() == "MOPUP":
                        continue
                except KeyError:
                    skipped_forms_list.append({form["_id"]: {"round": None, "date": form.get("date_monitored", None)}})
                    no_round_count += 1
                    continue
                if round_number[-1].isdigit():
                    round_number = round_number[-1]
                else:
                    skipped_forms_list.append(
                        {form["_id"]: {"round": form["roundNumber"], "date": form.get("date_monitored", None)}}
                    )
                    unknown_round += 1
                    continue
                if form.get("HH", None) and (form.get("_uuid", None) not in excluded_forms):
                    if "HH" in stats_types:
                        for kid in form.get("HH", []):
                            total_sites_visited += 1
                            Child_FMD = kid.get("HH/U5_Vac_FM_HH", 0)
                            Child_Checked = kid.get("HH/Total_U5_Present_HH", 0)
                            total_Child_FMD += int(Child_FMD)
                            total_Child_Checked += int(Child_Checked)
                            for reason in nfm_reason_keys:
                                nfm_counts_dict[reason] = nfm_counts_dict[reason] + int(
                                    kid.get("HH/group1/" + reason, "0")
                                )
                            for reason_abs in nfm_reason_abs_keys:
                                nfm_abs_counts_dict[reason_abs] = nfm_abs_counts_dict[reason_abs] + int(
                                    kid.get("HH/group2/" + reason_abs, "0")
                                )
                            done_something = True
                else:
                    if "OHH" in stats_types and form.get("_uuid", None) not in excluded_forms:
                        for kid in form.get("OHH", []):
                            total_sites_visited += 1
                            Child_FMD = kid.get("OHH/Child_FMD", 0)
                            Child_Checked = kid.get("OHH/Child_Checked", 0)
                            total_Child_FMD += int(Child_FMD)
                            total_Child_Checked += int(Child_Checked)
                            done_something = True
                if not done_something:
                    continue
                today_string = form.get("today", None)
                if today_string:
                    today = datetime.strptime(today_string, "%Y-%m-%d").date()
                else:
                    today = None
                campaign = find_lqas_im_campaign_cached(campaigns, today, country, round_number, "im")
                if not campaign:
                    campaign = find_lqas_im_campaign_cached(campaigns, today, country, None, "im")
                    if campaign:
                        campaign_name = campaign.obr_name
                        campaign_stats[campaign_name]["bad_round_number"] += 1
                region_name = form.get("Region")
                district_name = form.get("District", None)
                if not district_name:
                    district_name = form.get("district", None)
                if form.get("Response", None) and campaign:
                    debug_response.add((campaign.obr_name, form["Response"]))
                if campaign:
                    campaign_name = campaign.obr_name
                    # FIXME: We refetch the whole list for all submission this is probably a cause of slowness
                    scope = campaign.get_districts_for_round_number(round_number).values_list("id", flat=True)
                    campaign_stats[campaign_name]["has_scope"] = len(scope) > 0
                    district = find_district(district_name, region_name, district_dict)
                    if not district:
                        district_long_name = "%s - %s" % (district_name, region_name)
                        if district_long_name not in campaign_stats[campaign_name]["districts_not_found"]:
                            campaign_stats[campaign_name]["districts_not_found"].append(district_long_name)
                    # Sending district info if it exists and either the district is in scope or there's no scope (in which case we send all ifo for all distrcits found)
                    if district is not None and (district.id in scope or len(scope) == 0):
                        campaign_stats[campaign_name]["country_id"] = country.id
                        campaign_stats[campaign_name]["country_name"] = country.name
                        campaign_stats[campaign_name]["campaign"] = campaign
                        round_stats = campaign_stats[campaign_name]["rounds"][round_number]
                        round_stats["number"] = int(round_number)

                        for key in nfm_counts_dict:
                            round_stats["nfm_stats"][key] = round_stats["nfm_stats"][key] + nfm_counts_dict[key]

                        for key_abs in nfm_abs_counts_dict:
                            round_stats["nfm_abs_stats"][key_abs] = (
                                round_stats["nfm_abs_stats"][key_abs] + nfm_abs_counts_dict[key_abs]
                            )
                        d = round_stats["data"][district_name]
                        d["total_child_fmd"] = d["total_child_fmd"] + total_Child_FMD
                        d["total_child_checked"] = d["total_child_checked"] + total_Child_Checked
                        d["total_sites_visited"] = d["total_sites_visited"] + total_sites_visited
                        d["district"] = district.id
                        d["region_name"] = district.parent.name
                        fully_mapped_form_count += 1

                else:
                    day_country_not_found[country.name][today_string] += 1
                    form_campaign_not_found_count += 1
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
            "form_campaign_not_found_count": form_campaign_not_found_count,
            "day_country_not_found": day_country_not_found,
            "form_count": form_count,
            "fully_mapped_form_count": fully_mapped_form_count,
            "skipped_forms": skipped_forms,
            "cache_creation_date": datetime.utcnow().timestamp(),
        }

        if not request.user.is_anonymous:
            cache.set(
                "{0}-{1}-IM{2}".format(request.user.id, request.query_params["country_id"], im_request_type),
                json.dumps(response),
                3600,
                version=CACHE_VERSION,
            )

        return JsonResponse(response, safe=False)
