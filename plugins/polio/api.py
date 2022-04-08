import csv
import json
from datetime import timedelta, datetime, timezone
from typing import Optional

import requests
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import send_mail
from django.db.models import Q
from django.db.models.expressions import RawSQL
from django.http import HttpResponse
from django.http.response import HttpResponseBadRequest
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils.timezone import now, make_aware
from django_filters.rest_framework import DjangoFilterBackend
from gspread.utils import extract_id_from_url
from rest_framework import routers, filters, viewsets, serializers, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Value, TextField, UUIDField
from collections import defaultdict
from django.contrib.gis.geos import GEOSGeometry, GeometryCollection, GEOSException

from iaso.api.common import ModelViewSet
from iaso.models import OrgUnit
from iaso.models.org_unit import OrgUnitType
from plugins.polio.serializers import (
    CampaignSerializer,
    PreparednessPreviewSerializer,
    LineListImportSerializer,
    AnonymousCampaignSerializer,
    PreparednessSerializer,
    SmallCampaignSerializer,
    get_current_preparedness,
    CampaignGroupSerializer,
)
from plugins.polio.serializers import (
    CountryUsersGroupSerializer,
)
from plugins.polio.serializers import SurgePreviewSerializer, CampaignPreparednessSpreadsheetSerializer
from .forma import (
    get_forma_scope_df,
    fetch_and_match_forma_data,
    FormAStocksViewSetV2,
    make_orgunits_cache,
    find_orgunit_in_cache,
)
from .helpers import get_url_content
from .models import Campaign, Config, LineListImport, SpreadSheetImport, Round, CampaignGroup
from .models import CountryUsersGroup
from .models import URLCache, Preparedness
from .preparedness.calculator import preparedness_summary
from .preparedness.parser import get_preparedness, RoundNumber

from logging import getLogger

logger = getLogger(__name__)


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


class CampaignFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        query_param = request.query_params.get("deletion_status", "active")

        if query_param == "deleted":
            query = Q(deleted_at__isnull=False)
            return queryset.filter(query)

        if query_param == "active":
            query = Q(deleted_at__isnull=True)
            return queryset.filter(query)

        if query_param == "all":
            return queryset
        return queryset


class CampaignViewSet(ModelViewSet):
    results_key = "campaigns"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, CustomFilterBackend, CampaignFilterBackend]
    ordering_fields = [
        "obr_name",
        "cvdpv2_notified_at",
        "detection_status",
        "round_one__started_at",
        "round_two__started_at",
        "vacine",
        "country__name",
    ]
    filterset_fields = {
        "country__name": ["exact"],
        "country__id": ["in"],
        "groups__id": ["in", "exact"],
        "obr_name": ["exact", "contains"],
        "vacine": ["exact"],
        "cvdpv2_notified_at": ["gte", "lte", "range"],
        "created_at": ["gte", "lte", "range"],
        "round_one__started_at": ["gte", "lte", "range"],
    }

    # We allow anonymous read access for the embeddable calendar map view
    # in this case we use a restricted serializer with less field
    # notably not the url that we want to remain private.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.request.user.is_authenticated:
            return CampaignSerializer
        else:
            return AnonymousCampaignSerializer

    def get_queryset(self):
        user = self.request.user
        campaign_type = self.request.query_params.get("campaign_type")
        campaigns = Campaign.objects.all()
        campaigns.prefetch_related("round_one", "round_two", "group")
        if campaign_type == "preventive":
            campaigns = campaigns.filter(is_preventive=True)
        if campaign_type == "regular":
            campaigns = campaigns.filter(is_preventive=False)
        if user.is_authenticated and user.iaso_profile.org_units.count():
            org_units = OrgUnit.objects.hierarchy(user.iaso_profile.org_units.all())
            return campaigns.filter(initial_org_unit__in=org_units)
        else:
            return campaigns.filter()

    @action(methods=["POST"], detail=False, serializer_class=PreparednessPreviewSerializer)
    def preview_preparedness(self, request, **kwargs):
        serializer = PreparednessPreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

    @action(methods=["GET"], detail=True, serializer_class=serializers.Serializer)
    def preparedness(self, request, **kwargs):
        campaign = self.get_object()
        roundNumber = request.query_params.get("round", "")
        return Response(get_current_preparedness(campaign, roundNumber))

    @action(methods=["POST"], detail=True, serializer_class=CampaignPreparednessSpreadsheetSerializer)
    def create_preparedness_sheet(self, request, pk=None, **kwargs):
        serializer = CampaignPreparednessSpreadsheetSerializer(data={"campaign": pk})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(methods=["POST"], detail=False, serializer_class=SurgePreviewSerializer)
    def preview_surge(self, request, **kwargs):
        serializer = SurgePreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

    NEW_CAMPAIGN_MESSAGE = """Dear GPEI coordinator – {country_name}

This is an automated email.

Following the newly confirmed virus {virus_type} reported from {initial_orgunit_name} with date of onset/sample collection {onset_date}. \
A new outbreak {obr_name} has been created on the timeline tracker, to visualize the campaign visit: {url_campaign}

Some campaign details are missing at this stage. It is important to update the outbreak response information on this link {url}, \
to ensure optimal coordination of activities. The information should be updated at least weekly. Details for log in will be provided.

For more follow up: contact RRT team.

Timeline tracker Automated message
    """

    @action(methods=["POST"], detail=True, serializer_class=serializers.Serializer)
    def send_notification_email(self, request, pk, **kwargs):
        campaign = get_object_or_404(Campaign, pk=pk)
        country = campaign.country

        domain = settings.DNS_DOMAIN
        if campaign.creation_email_send_at:
            raise serializers.ValidationError("Notification Email already sent")
        if not (campaign.obr_name and campaign.virus and country and campaign.onset_at):
            raise serializers.ValidationError("Missing information on the campaign")

        email_text = self.NEW_CAMPAIGN_MESSAGE.format(
            country_name=country.name,
            obr_name=campaign.obr_name,
            virus_type=campaign.virus,
            onset_date=campaign.onset_at,
            initial_orgunit_name=campaign.initial_org_unit.name
            + (", " + campaign.initial_org_unit.parent.name if campaign.initial_org_unit.parent else ""),
            url=f"https://{domain}/dashboard/polio/list",
            url_campaign=f"https://{domain}/dashboard/polio/list/campaignId/{campaign.id}",
        )

        try:
            cug = CountryUsersGroup.objects.get(country=country)
        except CountryUsersGroup.DoesNotExist:
            raise serializers.ValidationError(
                f"Country {country.name} is not configured, please go to Configuration page"
            )
        users = cug.users.all()
        emails = [user.email for user in users if user.email]
        if not emails:
            raise serializers.ValidationError(f"No recipients have been configured on the country")

        send_mail(
            "New Campaign {}".format(campaign.obr_name),
            email_text,
            "no-reply@%s" % domain,
            emails,
        )
        campaign.creation_email_send_at = now()
        campaign.save()

        return Response({"message": "email sent"})

    @action(methods=["PATCH"], detail=False)
    def restore_deleted_campaigns(self, request):
        campaign = get_object_or_404(Campaign, pk=request.data["id"])
        if campaign.deleted_at is not None:
            campaign.deleted_at = None
            campaign.save()
            return Response(campaign.id, status=status.HTTP_200_OK)
        else:
            return Response("Campaign already active.", status=status.HTTP_400_BAD_REQUEST)

    @action(
        methods=["GET", "HEAD"],
        detail=False,
        url_path="merged_shapes.geojson",
        permission_classes=[permissions.IsAuthenticated],
    )
    def shapes(self, request):
        features = []
        queryset = self.filter_queryset(self.get_queryset())
        # Remove deleted and campaign with missing group
        queryset = queryset.filter(deleted_at=None).exclude(group=None)
        queryset = queryset.annotate(
            geom=RawSQL(
                """select st_asgeojson(st_simplify(st_union(st_buffer(iaso_orgunit.geom::geometry, 0)), 0.01)::geography)
from iaso_orgunit
         right join iaso_group_org_units ON iaso_group_org_units.orgunit_id = iaso_orgunit.id
where group_id = polio_campaign.group_id""",
                [],
            )
        )
        for c in queryset:
            if c.geom:
                s = SmallCampaignSerializer(c)
                feature = {"type": "Feature", "geometry": json.loads(c.geom), "properties": s.data}
                features.append(feature)
        res = {"type": "FeatureCollection", "features": features}
        return JsonResponse(res)


class CountryUsersGroupViewSet(ModelViewSet):
    serializer_class = CountryUsersGroupSerializer
    results_key = "country_users_group"
    http_method_names = ["get", "put"]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["country__name", "language"]

    def get_queryset(self):
        countries = OrgUnit.objects.filter_for_user_and_app_id(self.request.user).filter(
            org_unit_type__category="COUNTRY"
        )
        for country in countries:
            cug, created = CountryUsersGroup.objects.get_or_create(
                country=country
            )  # ensuring that such a model always exist
            if created:
                print(f"created {cug}")
        return CountryUsersGroup.objects.filter(country__in=countries)


class LineListImportViewSet(ModelViewSet):
    serializer_class = LineListImportSerializer
    results_key = "imports"

    def get_queryset(self):
        return LineListImport.objects.all()


DAYS_EVOLUTION = [
    # day before, target in percent
    (1, 90),
    (3, 85),
    (7, 80),
    (14, 60),
    (21, 40),
    (28, 20),
]


def score_for_x_day_before(ssi_for_campaign, ref_date: datetime.date, n_day: int):
    day = ref_date - timedelta(days=n_day)
    try:
        ssi = ssi_for_campaign.filter(created_at__date=day).last()
    except SpreadSheetImport.DoesNotExist:
        return None, day, None
    try:
        preparedness = get_preparedness(ssi.cached_spreadsheet)
        summary = preparedness_summary(preparedness)
        score = summary["overall_status_score"]
    except Exception as e:
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


def _make_prep(c: Campaign, round: Round, round_number: RoundNumber):
    url = round.preparedness_spreadsheet_url
    if not url:
        return None
    campaign_prep = {
        "campaign_id": c.id,
        "campaign_obr_name": c.obr_name,
        "indicators": {},
        "round": round_number,
        "round_id": round.id,
        "round_start": round.started_at,
        "round_end": round.ended_at,
    }
    try:
        spread_id = extract_id_from_url(url)
        ssi_qs = SpreadSheetImport.objects.filter(spread_id=spread_id)

        if not ssi_qs:
            # No import yet
            campaign_prep["status"] = "not_sync"
            campaign_prep["details"] = "This spreadsheet has not been synchronised yet"
            return None
        campaign_prep["date"] = ssi_qs.last().created_at
        cs = ssi_qs.last().cached_spreadsheet
        last_p = get_preparedness(cs)
        campaign_prep.update(preparedness_summary(last_p))
        if round_number != last_p["national"]["round"]:
            logger.info(f"Round mismatch on {c} {round}")

        campaign_prep["history"] = history_for_campaign(ssi_qs, round)
    except Exception as e:
        campaign_prep["status"] = "error"
        campaign_prep["details"] = str(e)
        logger.exception(e)
    return campaign_prep


class PreparednessDashboardViewSet(viewsets.ViewSet):
    def list(self, request):

        r = []
        qs = Campaign.objects.all()
        if request.query_params.get("campaign"):
            qs = qs.filter(obr_name=request.query_params.get("campaign"))

        for c in qs:
            if c.round_one:
                p = _make_prep(c, c.round_one, RoundNumber.round1)
                if p:
                    r.append(p)
            if c.round_two:
                p = _make_prep(c, c.round_two, RoundNumber.round2)
                if p:
                    r.append(p)
        return Response(r)


class PreparednessViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Preparedness.objects.all()
    serializer_class = PreparednessSerializer
    filter_backends = (DjangoFilterBackend,)

    filterset_fields = {
        "campaign_id": ["exact"],
    }


class IMViewSet(viewsets.ViewSet):
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

        slug = request.GET.get("country", None)
        as_csv = request.GET.get("format", None) == "csv"
        config = get_object_or_404(Config, slug=slug)
        res = []
        failure_count = 0
        all_keys = set()
        for config in config.content:
            keys = config["keys"]
            all_keys = all_keys.union(keys.keys())
            prefix = config["prefix"]
            cached_response, created = URLCache.objects.get_or_create(url=config["url"])
            delta = now() - cached_response.updated_at
            if created or delta > timedelta(minutes=60):
                response = requests.get(config["url"], auth=(config["login"], config["password"]))
                cached_response.content = response.text
                cached_response.save()
                forms = response.json()
            else:
                forms = json.loads(cached_response.content)

            form_count = 0
            for form in forms:
                print(json.dumps(form))
                break
                try:
                    copy_form = form.copy()
                    del copy_form[prefix]
                    all_keys = all_keys.union(copy_form.keys())
                    for key in keys.keys():
                        value = form.get(key, None)
                        if value is None:
                            value = form[prefix][0]["%s/%s" % (prefix, key)]
                        copy_form[keys[key]] = value
                    count = 1
                    for sub_part in form[prefix]:
                        for k in sub_part.keys():
                            new_key = "%s[%d]/%s" % (prefix, count, k[len(prefix) + 1 :])
                            all_keys.add(new_key)
                            copy_form[new_key] = sub_part[k]
                        count += 1
                    copy_form["type"] = prefix
                    res.append(copy_form)
                except Exception as e:
                    print("failed on ", e, form, prefix)
                    failure_count += 1
                form_count += 1

        print("parsed:", len(res), "failed:", failure_count)
        # print("all_keys", all_keys)

        all_keys = sorted(list(all_keys))
        all_keys.insert(0, "type")
        if not as_csv:
            for item in res:
                for k in all_keys:
                    if k not in item:
                        item[k] = None
            return JsonResponse(res, safe=False)
        else:
            response = HttpResponse(content_type="text/csv")

            writer = csv.writer(response)
            writer.writerow(all_keys)
            i = 1
            for item in res:
                ar = [item.get(key, None) for key in all_keys]
                writer.writerow(ar)
                i += 1
                if i % 100 == 0:
                    print(i)
            return response


def _build_district_cache(districts_qs):
    district_dict = defaultdict(list)
    for f in districts_qs:
        district_dict[f.name.lower()].append(f)
        if f.aliases:
            for alias in f.aliases:
                district_dict[alias.lower()].append(f)
    return district_dict


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
        if requested_country is None:
            return HttpResponseBadRequest

        requested_country = int(requested_country)

        campaigns = Campaign.objects.filter(country_id=requested_country)

        if campaigns:
            latest_campaign_update = campaigns.latest("updated_at").updated_at
        else:
            latest_campaign_update = None

        stats_types = request.GET.get("type", "OH,OHH")

        im_request_type = stats_types

        if stats_types == "OH,OHH":
            im_request_type = ""

        cached_response = cache.get(
            "{0}-{1}-IM{2}".format(request.user.id, request.query_params["country_id"], im_request_type)
        )

        if not request.user.is_anonymous and cached_response:
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

        form_count = 0
        fully_mapped_form_count = 0
        base_stats = {"total_child_fmd": 0, "total_child_checked": 0, "total_sites_visited": 0}
        campaign_stats = defaultdict(
            lambda: {
                "round_1": defaultdict(base_stats.copy),
                "round_2": defaultdict(base_stats.copy),
                "round_1_nfm_stats": defaultdict(int),
                "round_2_nfm_stats": defaultdict(int),
                "round_1_nfm_abs_stats": defaultdict(int),
                "round_2_nfm_abs_stats": defaultdict(int),
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
                .only("name", "id", "parent", "aliases")
                .prefetch_related("parent")
            )
            district_dict = _build_district_cache(districts_qs)

            cached_response, created = URLCache.objects.get_or_create(url=country_config["url"])
            delta = now() - cached_response.updated_at
            if created or delta > timedelta(minutes=60 * 24 * 10):
                print("fetching", country_config["url"])
                response = requests.get(
                    country_config["url"], auth=(country_config["login"], country_config["password"])
                )
                print("fetched")
                print(len(response.text))
                cached_response.content = response.text

                cached_response.save()
                forms = response.json()
            else:
                print("already cached", country_config["url"])
                forms = json.loads(cached_response.content)

            for form in forms:
                form_count += 1
                total_sites_visited = 0
                total_Child_FMD = 0
                total_Child_Checked = 0
                nfm_counts_dict = defaultdict(int)
                nfm_abs_counts_dict = defaultdict(int)
                done_something = False
                if isinstance(form, str):
                    print("------------")
                    print("wrong form format:", form, "in", country.name)
                    print("------------")
                    continue
                try:
                    round_number = form["roundNumber"]
                    if round_number.upper() == "MOPUP":
                        continue
                except KeyError:
                    skipped_forms_list.append({form["_id"]: {"round": None, "date": form["date_monitored"]}})
                    no_round_count += 1
                    continue
                round_number = form["roundNumber"]
                if round_number.endswith("1") or round_number.endswith("2"):
                    round_number = "Rnd" + round_number[-1]
                else:
                    skipped_forms_list.append(
                        {form["_id"]: {"round": form["roundNumber"], "date": form["date_monitored"]}}
                    )
                    unknown_round += 1
                    continue
                if form.get("HH", None):
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
                    if "OHH" in stats_types:
                        for kid in form.get("OHH", []):
                            total_sites_visited += 1
                            Child_FMD = kid.get("OHH/Child_FMD", 0)
                            Child_Checked = kid.get("OHH/Child_Checked", 0)

                            total_Child_FMD += int(Child_FMD)
                            total_Child_Checked += int(Child_Checked)
                            done_something = True
                if not done_something:
                    continue
                today_string = form["today"]
                today = datetime.strptime(today_string, "%Y-%m-%d").date()
                round_key = {"Rnd1": "round_1", "Rnd2": "round_2"}[round_number]
                campaign = find_lqas_im_campaign(campaigns, today, country, round_key, "im")
                if not campaign:
                    other_round_key = "round_2" if round_key == "round_1" else "round_2"
                    campaign = find_lqas_im_campaign(campaigns, today, country, other_round_key, "im")
                    if campaign:
                        campaign_name = campaign.obr_name
                        campaign_stats[campaign_name]["bad_round_number"] += 1
                region_name = form.get("Region")
                district_name = form.get("District")

                if campaign:
                    campaign_name = campaign.obr_name
                    scope = campaign.group.org_units.values_list("id", flat=True) if campaign.group else []
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
                        round_stats_key = round_key + "_nfm_stats"
                        round_stats_abs_key = round_key + "_nfm_abs_stats"
                        for key in nfm_counts_dict:
                            campaign_stats[campaign_name][round_stats_key][key] = (
                                campaign_stats[campaign_name][round_stats_key][key] + nfm_counts_dict[key]
                            )
                        for key_abs in nfm_abs_counts_dict:
                            campaign_stats[campaign_name][round_stats_abs_key][key_abs] = (
                                campaign_stats[campaign_name][round_stats_abs_key][key_abs]
                                + nfm_abs_counts_dict[key_abs]
                            )
                        d = campaign_stats[campaign_name][round_key][district_name]
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
            )

        return JsonResponse(response, safe=False)


def find_campaign(campaigns, today, country):
    for c in campaigns:
        if not (c.round_one and c.round_one.started_at):
            continue
        if c.country_id == country.id and c.round_one.started_at <= today < c.round_one.started_at + timedelta(
            days=+28
        ):
            return c
    return None


def find_lqas_im_campaign(campaigns, today, country, round_key, kind):
    lqas_im_start = kind + "_started_at"
    lqas_im_end = kind + "_ended_at"
    if round_key == "round_1":
        round_number = "round_one"
    if round_key == "round_2":
        round_number = "round_two"
    for campaign in campaigns:
        # We're skipping forms for a given round if the round dates have not been input ion the dashboard
        if not (
            campaign.get_item_by_key(round_number)
            and campaign.get_item_by_key(round_number).started_at
            and campaign.get_item_by_key(round_number).ended_at
        ):
            continue
        current_round = campaign.get_item_by_key(round_number)
        reference_start_date = current_round.started_at
        reference_end_date = current_round.ended_at
        if current_round.get_item_by_key(lqas_im_start):
            # What if IM start date is after round end date?
            reference_start_date = current_round.get_item_by_key(lqas_im_start)
        if current_round.get_item_by_key(lqas_im_end):
            reference_end_date = current_round.get_item_by_key(lqas_im_end)
        # Temporary answer to question above
        if reference_end_date <= reference_start_date:
            reference_end_date = reference_start_date + timedelta(days=+10)
        if campaign.country_id == country.id and reference_start_date <= today <= reference_end_date:
            return campaign
    return None


def find_campaign_on_day(campaigns, day, country):
    for c in campaigns:
        if not (c.round_one and c.round_one.started_at):
            continue
        round_end = c.round_two.ended_at if (c.round_two and c.round_two.ended_at) else c.round_one.ended_at
        if round_end:
            end_date = round_end + timedelta(days=+10)
        else:
            end_date = c.round_one.started_at + timedelta(days=+28)

        if c.country_id == country.id and c.round_one.started_at <= day < end_date:
            return c
    return None


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


def handle_ona_request_with_key(request, key):
    as_csv = request.GET.get("format", None) == "csv"
    config = get_object_or_404(Config, slug=key)
    res = []
    failure_count = 0
    campaigns = Campaign.objects.all()
    form_count = 0
    for config in config.content:
        forms = get_url_content(
            url=config["url"], login=config["login"], password=config["password"], minutes=config.get("minutes", 60)
        )
        country = OrgUnit.objects.get(id=config["country_id"])
        facilities = (
            OrgUnit.objects.hierarchy(country)
            .filter(org_unit_type_id__category="HF")
            .only("name", "id", "parent")
            .prefetch_related("parent")
        )
        cache = make_orgunits_cache(facilities)

        for form in forms:
            try:
                today = datetime.strptime(form["today"], "%Y-%m-%d").date()
                campaign = find_campaign_on_day(campaigns, today, country)
                district_name = form.get("District", "")
                facility_name = form.get("facility", None)
                # some form version for Senegal had their facility column as Facility with an uppercase.
                if not facility_name:
                    facility_name = form.get("Facility", "")

                if facility_name:
                    facility = find_orgunit_in_cache(cache, facility_name, district_name)
                    form["facility_id"] = facility.id if facility else None
                else:
                    form["facility_id"] = None

                form["country"] = country.name

                if campaign:
                    form["campaign_id"] = campaign.id
                    form["epid"] = campaign.epid
                    form["obr"] = campaign.obr_name
                else:
                    form["campaign_id"] = None
                    form["epid"] = None
                    form["obr"] = None
                res.append(form)
                form_count += 1
            except:
                print("failed parsing of ", form)
                failure_count += 1
    print("parsed:", len(res), "failed:", failure_count)
    # print("all_keys", all_keys)
    res = convert_dicts_to_table(res)

    if as_csv:
        response = HttpResponse(content_type="text/csv")
        writer = csv.writer(response)
        i = 1
        for item in res:
            writer.writerow(item)
        return response
    else:
        return JsonResponse(res, safe=False)


class VaccineStocksViewSet(viewsets.ViewSet):
    """
    Endpoint used to transform Vaccine Stocks data from existing ODK forms stored in ONA.
    sample config: [{"url": "https://afro.who.int/api/v1/data/yyy", "login": "d", "country": "hyrule", "password": "zeldarules", "country_id": 2115781}]
    """

    def list(self, request):
        return handle_ona_request_with_key(request, "vaccines")


class FormAStocksViewSet(viewsets.ViewSet):
    """
    Endpoint used to transform Vaccine Stocks data from existing ODK forms stored in ONA.
    sample config: [{"url": "https://afro.who.int/api/v1/data/yyy", "login": "d", "country": "hyrule", "password": "zeldarules", "country_id": 2115781}]
    """

    def list(self, request):
        return handle_ona_request_with_key(request, "forma")


def org_unit_as_array(o):
    res = [o.campaign_id, o.campaign_obr, o.id, o.name, o.org_unit_type.name]

    parent = o
    for i in range(4):
        if parent:
            parent = parent.parent
        if parent:
            res.extend([parent.id, parent.name])
        else:
            res.extend((None, None))
    return res


class OrgUnitsPerCampaignViewset(viewsets.ViewSet):
    def list(self, request):
        org_unit_type = request.GET.get("org_unit_type_id", None)
        as_csv = request.GET.get("format", None) == "csv"
        campaigns = Campaign.objects.all()
        queryset = OrgUnit.objects.none()

        for campaign in campaigns:
            districts = OrgUnit.objects.filter(groups=campaign.group_id)
            if districts:
                all_facilities = OrgUnit.objects.hierarchy(districts)
                if org_unit_type:
                    all_facilities = all_facilities.filter(org_unit_type_id=org_unit_type)
                all_facilities = (
                    all_facilities.prefetch_related("parent")
                    .prefetch_related("parent__parent")
                    .prefetch_related("parent__parent__parent")
                    .prefetch_related("parent__parent__parent__parent")
                )
                all_facilities = all_facilities.annotate(campaign_id=Value(campaign.id, UUIDField()))
                all_facilities = all_facilities.annotate(campaign_obr=Value(campaign.obr_name, TextField()))
                queryset = queryset.union(all_facilities)

        headers = [
            "campaign_id",
            "campaign_obr",
            "org_unit_id",
            "org_unit_name",
            "type",
            "parent1_id",
            "parent1_name",
            "parent2_id",
            "parent2_name",
            "parent3_id",
            "parent3_name",
            "parent4_id",
            "parent4_name",
        ]
        res = [headers]
        res.extend([org_unit_as_array(o) for o in queryset])
        if as_csv:
            response = HttpResponse(content_type="text/csv")
            writer = csv.writer(response)
            for item in res:
                writer.writerow(item)
            return response
        else:
            return JsonResponse(res, safe=False)


def find_district(district_name, region_name, district_dict):
    district_name_lower = district_name.lower() if district_name else None
    district_list = district_dict.get(district_name_lower)
    if district_list and len(district_list) == 1:
        return district_list[0]
    elif district_list and len(district_list) > 1:
        for di in district_list:
            if di.parent.name.lower() == region_name.lower() or (
                di.parent.aliases and region_name in di.parent.aliases
            ):
                return di
    return None


# Checking for each district for each campaign if LQAS data is not disqualified. If it isn't we add the reasons no finger mark to the count
def add_nfm_stats_for_round(campaign_stats, nfm_stats, round_number):
    for campaign, stats in campaign_stats.items():
        for district, district_stats in stats[round_number].items():
            if district_stats["total_child_checked"] == 60:
                for reason, count in nfm_stats[campaign][round_number][district].items():
                    stats[round_number + "_nfm_stats"][reason] = stats[round_number + "_nfm_stats"][reason] + count
    return campaign_stats


# TODO deduplicate
# Checking for each district for each campaign if LQAS data is not disqualified. If it isn't we add the reasons for absence to the count
def add_nfm_abs_stats_for_round(campaign_stats, nfm_abs_stats, round_number):
    for campaign, stats in campaign_stats.items():
        for district, district_stats in stats[round_number].items():
            if district_stats["total_child_checked"] == 60:
                for reason, count in nfm_abs_stats[campaign][round_number][district].items():
                    stats[round_number + "_nfm_abs_stats"][reason] = (
                        stats[round_number + "_nfm_abs_stats"][reason] + count
                    )
    return campaign_stats


def format_caregiver_stats(campaign_stats, round_number):
    for campaign in campaign_stats.values():
        for district in campaign[round_number].values():
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


class LQASStatsViewSet(viewsets.ViewSet):
    """
    Endpoint used to transform IM (independent monitoring) data from existing ODK forms stored in ONA.
    """

    def list(self, request):

        requested_country = request.GET.get("country_id", None)
        if requested_country is None:
            return HttpResponseBadRequest
        requested_country = int(requested_country)

        campaigns = Campaign.objects.filter(country_id=requested_country)
        if campaigns:
            latest_campaign_update = campaigns.latest("updated_at").updated_at
        else:
            latest_campaign_update = None

        cached_response = cache.get("{0}-{1}-LQAS".format(request.user.id, request.query_params["country_id"]))

        if not request.user.is_anonymous and cached_response:
            response = json.loads(cached_response)
            cached_date = make_aware(datetime.utcfromtimestamp(response["cache_creation_date"]))
            if latest_campaign_update and cached_date > latest_campaign_update:
                return JsonResponse(response)

        config = get_object_or_404(Config, slug="lqas-config")
        skipped_forms_list = []
        no_round_count = 0
        unknown_round = 0
        skipped_forms = {"count": 0, "no_round": 0, "unknown_round": unknown_round, "forms_id": skipped_forms_list}

        base_stats = lambda: {
            "total_child_fmd": 0,
            "total_child_checked": 0,
            "care_giver_stats": defaultdict(float),
            "total_sites_visited": 0,
        }
        campaign_stats = defaultdict(
            lambda: {
                "round_1": defaultdict(base_stats),
                "round_1_nfm_stats": defaultdict(int),
                "round_1_nfm_abs_stats": defaultdict(int),
                "round_2": defaultdict(base_stats),
                "round_2_nfm_stats": defaultdict(int),
                "round_2_nfm_abs_stats": defaultdict(int),
                "districts_not_found": [],
                "has_scope": [],
                # Submission where it says a certain round but the date place it in another round
                "bad_round_number": 0,
            }
        )
        # Storing all "reasons no finger mark" for each campaign in this dict
        nfm_reasons_per_district_per_campaign = defaultdict(
            lambda: {
                "round_1": defaultdict(lambda: defaultdict(int)),
                "round_2": defaultdict(lambda: defaultdict(int)),
            }
        )
        # Same with reasons for absence
        nfm_abs_reasons_per_district_per_campaign = defaultdict(
            lambda: {
                "round_1": defaultdict(lambda: defaultdict(int)),
                "round_2": defaultdict(lambda: defaultdict(int)),
            }
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
                .only("name", "id", "parent", "aliases")
                .prefetch_related("parent")
            )
            district_dict = _build_district_cache(districts_qs)

            cached_response, created = URLCache.objects.get_or_create(url=country_config["url"])
            delta = now() - cached_response.updated_at
            if created or delta > timedelta(minutes=60 * 24 * 10):
                response = requests.get(
                    country_config["url"], auth=(country_config["login"], country_config["password"])
                )
                cached_response.content = response.text
                cached_response.save()
                forms = response.json()
            else:
                forms = json.loads(cached_response.content)

            districts = set()
            for form in forms:
                try:
                    round_number = form["roundNumber"]
                    if round_number.upper() == "MOPUP":
                        continue
                except KeyError:
                    skipped_forms_list.append({form["_id"]: {"round": None, "date": form["Date_of_LQAS"]}})
                    no_round_count += 1
                    continue
                round_number = form["roundNumber"]
                if round_number.endswith("1") or round_number.endswith("2"):
                    round_number = "Rnd" + round_number[-1]
                else:
                    skipped_forms_list.append(
                        {form["_id"]: {"round": form["roundNumber"], "date": form["Date_of_LQAS"]}}
                    )
                    unknown_round += 1
                    continue
                HH_COUNT = form.get("Count_HH", None)
                if HH_COUNT is None:
                    print("missing OHH_COUNT", form)

                district_name = form.get("District")
                total_sites_visited = 0
                total_Child_FMD = 0
                total_Child_Checked = 0
                caregiver_counts_dict = defaultdict(lambda: defaultdict(int))
                region_name = form.get("Region")
                district_id = "%s - %s" % (district_name, region_name)
                districts.add(district_id)
                today_string = form["today"]
                today = datetime.strptime(today_string, "%Y-%m-%d").date()
                round_key = {"Rnd1": "round_1", "Rnd2": "round_2"}[round_number]
                campaign = find_lqas_im_campaign(campaigns, today, country, round_key, "lqas")
                if not campaign:
                    other_round_key = "round_2" if round_key == "round_1" else "round_2"
                    campaign = find_lqas_im_campaign(campaigns, today, country, other_round_key, "lqas")
                    if campaign:
                        campaign_name = campaign.obr_name
                        campaign_stats[campaign_name]["bad_round_number"] += 1

                for HH in form.get("Count_HH", []):
                    total_sites_visited += 1
                    # check finger
                    Child_FMD = HH.get("Count_HH/FM_Child", 0)
                    Child_Checked = HH.get("Count_HH/Child_Checked", 0)
                    if Child_FMD == "Y":
                        total_Child_FMD += 1
                    else:
                        reason = HH.get("Count_HH/Reason_Not_FM")
                        if reason and campaign and round_number:
                            nfm_reasons_per_district_per_campaign[campaign.obr_name][round_key][district_name][
                                reason
                            ] = (
                                nfm_reasons_per_district_per_campaign[campaign.obr_name][round_key][district_name][
                                    reason
                                ]
                                + 1
                            )
                        if reason == "childabsent" and campaign and round_number:
                            reason_abs = HH.get("Count_HH/Reason_ABS_NFM", "unknown")
                            nfm_abs_reasons_per_district_per_campaign[campaign.obr_name][round_key][district_name][
                                reason_abs
                            ] = (
                                nfm_abs_reasons_per_district_per_campaign[campaign.obr_name][round_key][district_name][
                                    reason_abs
                                ]
                                + 1
                            )
                    total_Child_Checked += int(Child_Checked)
                    # gather caregiver stats
                    caregiver_informed = HH.get("Count_HH/Care_Giver_Informed_SIA", 0)
                    caregiver_source_info = HH.get("Count_HH/Caregiver_Source_Info", None)
                    if caregiver_informed == "Y":
                        caregiver_counts_dict[district_name]["caregivers_informed"] = (
                            caregiver_counts_dict[district_name]["caregivers_informed"] + 1
                        )

                    if isinstance(caregiver_source_info, str):
                        source_keys = caregiver_source_info.split()
                        for source_key in source_keys:
                            caregiver_counts_dict[district_name][source_key] = (
                                caregiver_counts_dict[district_name][source_key] + 1
                            )
                    else:
                        for source_info_key in caregiver_source_info_keys:
                            source_info = HH.get("Count_HH/Caregiver_Source_Info/" + source_info_key)
                            if source_info == "True":
                                caregiver_counts_dict[district_name][source_info_key] = (
                                    caregiver_counts_dict[district_name][source_info_key] + 1
                                )
                if campaign:
                    campaign_name = campaign.obr_name
                    scope = campaign.group.org_units.values_list("id", flat=True) if campaign.group else []
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
                        d = campaign_stats[campaign_name][round_key][district_name]

                        for key in caregiver_counts_dict[district_name]:
                            d["care_giver_stats"][key] += caregiver_counts_dict[district_name][key]

                        d["total_child_fmd"] = d["total_child_fmd"] + total_Child_FMD
                        d["total_child_checked"] = d["total_child_checked"] + len(form.get("Count_HH", []))
                        d["total_sites_visited"] = d["total_sites_visited"] + total_sites_visited
                        d["district"] = district.id
                        d["region_name"] = district.parent.name
                else:
                    day_country_not_found[country.name][today_string] += 1
                    form_campaign_not_found_count += 1
                form_count += 1

        add_nfm_stats_for_round(campaign_stats, nfm_reasons_per_district_per_campaign, "round_1")
        add_nfm_stats_for_round(campaign_stats, nfm_reasons_per_district_per_campaign, "round_2")
        add_nfm_abs_stats_for_round(campaign_stats, nfm_abs_reasons_per_district_per_campaign, "round_1")
        add_nfm_abs_stats_for_round(campaign_stats, nfm_abs_reasons_per_district_per_campaign, "round_2")
        format_caregiver_stats(campaign_stats, "round_1")
        format_caregiver_stats(campaign_stats, "round_2")

        skipped_forms.update(
            {"count": len(skipped_forms_list), "no_round": no_round_count, "unknown_round": unknown_round}
        )

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
                "{0}-{1}-LQAS".format(request.user.id, request.query_params["country_id"]), json.dumps(response), 3600
            )
        return JsonResponse(response, safe=False)


class CampaignGroupViewSet(ModelViewSet):
    results_key = "results"
    queryset = CampaignGroup.objects.all()
    serializer_class = CampaignGroupSerializer

    # We allow anonymous read access for the embeddable calendar map view
    # in this case we use a restricted serializer with less field
    # notably not the url that we want to remain private.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ["id"]
    filterset_fields = {
        "name": ["icontains"],
    }


router = routers.SimpleRouter()
router.register(r"polio/campaigns", CampaignViewSet, basename="Campaign")
router.register(r"polio/campaignsgroup", CampaignGroupViewSet, basename="campaigngroup")
router.register(r"polio/preparedness", PreparednessViewSet)
router.register(r"polio/preparedness_dashboard", PreparednessDashboardViewSet, basename="preparedness_dashboard")
router.register(r"polio/im", IMViewSet, basename="IM")
router.register(r"polio/imstats", IMStatsViewSet, basename="imstats")
router.register(r"polio/lqasstats", LQASStatsViewSet, basename="lqasstats")
router.register(r"polio/vaccines", VaccineStocksViewSet, basename="vaccines")
router.register(r"polio/forma", FormAStocksViewSet, basename="forma")
router.register(r"polio/v2/forma", FormAStocksViewSetV2, basename="forma")
router.register(r"polio/countryusersgroup", CountryUsersGroupViewSet, basename="countryusersgroup")
router.register(r"polio/linelistimport", LineListImportViewSet, basename="linelistimport")
router.register(r"polio/orgunitspercampaign", OrgUnitsPerCampaignViewset, basename="orgunitspercampaign")
