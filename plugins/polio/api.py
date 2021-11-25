import csv
import json
from datetime import timedelta, datetime

import requests
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q
from django.http import HttpResponse
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from django_filters.rest_framework import DjangoFilterBackend
from gspread.utils import extract_id_from_url
from rest_framework import routers, filters, viewsets, serializers, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Value, IntegerField, TextField, UUIDField
from collections import defaultdict


from iaso.api.common import ModelViewSet
from iaso.models import OrgUnit
from iaso.models.org_unit import OrgUnitType
from plugins.polio.serializers import (
    CampaignSerializer,
    PreparednessPreviewSerializer,
    LineListImportSerializer,
    AnonymousCampaignSerializer,
    PreparednessSerializer,
)
from plugins.polio.serializers import (
    CountryUsersGroupSerializer,
)
from plugins.polio.serializers import SurgePreviewSerializer, CampaignPreparednessSpreadsheetSerializer
from .models import Campaign, Config, LineListImport, SpreadSheetImport
from .models import CountryUsersGroup
from .models import URLCache, Preparedness
from .preparedness.calculator import preparedness_summary
from .preparedness.parser import get_preparedness

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


class CampaignViewSet(ModelViewSet):

    results_key = "campaigns"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, CustomFilterBackend]
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

        if user.is_authenticated and user.iaso_profile.org_units.count():
            org_units = OrgUnit.objects.hierarchy(user.iaso_profile.org_units.all())
            return Campaign.objects.filter(initial_org_unit__in=org_units)
        else:
            return Campaign.objects.all()

    @action(methods=["POST"], detail=False, serializer_class=PreparednessPreviewSerializer)
    def preview_preparedness(self, request, **kwargs):
        serializer = PreparednessPreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

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
A new outbreak {obr_name} has been created on the timeline tracker, to visualize the campaign visit: {url}

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


class PreparednessDashboardViewSet(viewsets.ViewSet):
    def list(self, request):

        r = []
        qs = Campaign.objects.filter(preperadness_spreadsheet_url__isnull=False)
        if request.query_params.get("campaign"):
            qs = qs.filter(obr_name=request.query_params.get("campaign"))

        for c in qs:
            campaign_prep = {
                "campaign_id": c.id,
                "campaign_obr_name": c.obr_name,
                "indicators": {},
            }
            try:
                ssi = SpreadSheetImport.objects.filter(spread_id=extract_id_from_url(c.preperadness_spreadsheet_url))

                if not ssi:
                    # No import yet
                    campaign_prep["status"] = "not_sync"
                    continue
                campaign_prep["date"]: ssi.last().created_at
                last_p = get_preparedness(ssi.last().cached_spreadsheet)
                campaign_prep.update(preparedness_summary(last_p))
            except Exception as e:
                campaign_prep["status"] = "error"
                campaign_prep["details"] = str(e)
                logger.exception(e)

            r.append(campaign_prep)
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


def find_campaign(campaigns, today, country):
    for c in campaigns:
        if c.country_id == country.id and c.round_one.started_at <= today < c.round_one.started_at + timedelta(
            days=+28
        ):
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


def get_url_content(url, login, password, minutes=60):
    cached_response, created = URLCache.objects.get_or_create(url=url)
    delta = now() - cached_response.updated_at
    if created or delta > timedelta(minutes=minutes):
        response = requests.get(url, auth=(login, password))
        cached_response.content = response.text
        cached_response.save()
        j = response.json()
    else:
        j = json.loads(cached_response.content)
    return j


def get_facility_id(district_name, facility_name, facilities_dict):
    facility_list = facilities_dict.get(facility_name)
    if facility_list is None:
        return None
    if len(facility_list) == 1:
        return facility_list[0].id
    if len(facility_list) > 1:

        for facility in facility_list:
            if facility.parent.name.lower() == district_name.lower() or district_name in facility.parent.aliases:
                return facility.id

    return None


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
        facilities_dict = defaultdict(list)
        for f in facilities:
            facilities_dict[f.name].append(f)

        for form in forms:
            try:
                today = datetime.strptime(form["today"], "%Y-%m-%d").date()
                campaign = find_campaign(campaigns, today, country)
                district_name = form.get("District", None)
                facility_name = form.get("facility", None)

                if district_name and facility_name:
                    form["facility_id"] = get_facility_id(district_name, facility_name, facilities_dict)
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


def find_district(district_name, region_name, districts, district_dict):
    district_list = district_dict.get(district_name)
    if district_list and len(district_list) == 1:
        return district_list[0]
    elif district_list and len(district_list) > 1:
        for di in district_list:
            if di.parent.name.lower() == region_name.lower() or region_name in di.parent.aliases:
                return di
    else:
        for d in districts:
            if d.aliases and district_name in d.aliases:
                district_dict[district_name] = [d]
                return d
    return None


class IMViewSet2(viewsets.ViewSet):
    """
    Endpoint used to transform IM (independent monitoring) data from existing ODK forms stored in ONA.
    """

    def list(self, request):
        campaigns = Campaign.objects.all()
        districts_not_found = set()
        slug = request.GET.get("country", None)
        as_csv = request.GET.get("format", None) == "csv"
        country = OrgUnit.objects.get(pk=29709)
        config = get_object_or_404(Config, slug=slug)
        res = []
        failure_count = 0
        all_keys = set()

        districts_qs = (
            OrgUnit.objects.hierarchy(country)
            .filter(org_unit_type_id__category="DISTRICT")
            .only("name", "id", "parent", "aliases")
            .prefetch_related("parent")
        )
        district_dict = defaultdict(list)
        for f in districts_qs:
            district_dict[f.name].append(f)

        for config in config.content:
            keys = config["keys"]
            all_keys = all_keys.union(keys.keys())
            prefix = config["prefix"]
            cached_response, created = URLCache.objects.get_or_create(url=config["url"])
            delta = now() - cached_response.updated_at
            if created or delta > timedelta(minutes=24 * 60 * 10):
                response = requests.get(config["url"], auth=(config["login"], config["password"]))
                cached_response.content = response.text
                cached_response.save()
                forms = response.json()
            else:
                forms = json.loads(cached_response.content)

            form_count = 0
            base_stats = {"total_child_fmd": 0, "total_child_checked": 0}
            base_campaign_stats = {"round_1": defaultdict(base_stats.copy), "round_2": defaultdict(base_stats.copy)}
            campaign_stats = defaultdict(base_campaign_stats.copy)
            districts = set()
            for form in forms:
                HH_COUNT = form.get("Count_HH", None)
                if HH_COUNT is None:
                    print("missing OHH_COUNT", form)

                total_Child_FMD = 0
                total_Child_Checked = 0
                for HH in form.get("Count_HH", []):
                    type = "HH"
                    Child_FMD = HH.get("Count_HH/FM_Child", 0)
                    Child_Checked = HH.get("Count_HH/Child_Checked", 0)
                    if Child_FMD == "Y":
                        total_Child_FMD += 1
                    total_Child_Checked += int(Child_Checked)
                district_id = "%s - %s" % (form.get("District"), form.get("Region"))
                districts.add(district_id)

                today = datetime.strptime(form["today"], "%Y-%m-%d").date()
                campaign = find_campaign(campaigns, today, country)
                region_name = form.get("Region")
                district_name = form.get("District")
                round_number = form.get("roundNumber")

                if campaign:
                    campaign_name = campaign.obr_name
                    row = [
                        type,
                        "Niger",
                        region_name,
                        district_name,
                        form.get("Response"),
                        round_number,
                        form.get("today"),
                        total_Child_FMD,
                        len(form.get("Count_HH", [])),
                        campaign_name,
                    ]
                    res.append(row)

                    round_key = {"Rnd1": "round_1", "Rnd2": "round_2"}[round_number]

                    print(campaign_name, round_key, district_name)
                    # convert to array here
                    d = campaign_stats[campaign_name][round_key][district_name]
                    d["total_child_fmd"] = d["total_child_fmd"] + row[7]
                    d["total_child_checked"] = d["total_child_checked"] + row[7]
                    region_name = row[2]
                    district_name = row[3]
                    district = find_district(district_name, region_name, districts_qs, district_dict)
                    if not district:
                        districts_not_found.add("%s - %s" % (district_name, region_name))
                    else:
                        d["district"] = district.id
                form_count += 1

        print("parsed:", len(res), "failed:", failure_count)
        # print("all_keys", all_keys)
        print(districts)
        response = {
            "stats": campaign_stats,
            "districts_not_found": list(districts_not_found),
            # "rows": res,
        }
        return JsonResponse(response, safe=False)


router = routers.SimpleRouter()
router.register(r"polio/campaigns", CampaignViewSet, basename="Campaign")
router.register(r"polio/preparedness", PreparednessViewSet)
router.register(r"polio/preparedness_dashboard", PreparednessDashboardViewSet, basename="preparedness_dashboard")
router.register(r"polio/im", IMViewSet, basename="IM")
router.register(r"polio/imstats", IMViewSet2, basename="imstats")
router.register(r"polio/vaccines", VaccineStocksViewSet, basename="vaccines")
router.register(r"polio/forma", FormAStocksViewSet, basename="forma")
router.register(r"polio/countryusersgroup", CountryUsersGroupViewSet, basename="countryusersgroup")
router.register(r"polio/linelistimport", LineListImportViewSet, basename="linelistimport")
router.register(r"polio/orgunitspercampaign", OrgUnitsPerCampaignViewset, basename="orgunitspercampaign")
