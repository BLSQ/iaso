import csv
import datetime as dt
import functools
import json
from collections import defaultdict
from datetime import timedelta, datetime
from functools import lru_cache
from logging import getLogger
from typing import Any, List, Optional, Union
from django.db.models.query import QuerySet
from drf_yasg.utils import swagger_auto_schema, no_body
from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.db.models import Q, Max, Min
from django.db.models import Value, TextField, UUIDField
from django.db.models.expressions import RawSQL
from django.http import FileResponse
from django.http import HttpResponse
from django.http import JsonResponse
from django.http.response import HttpResponseBadRequest
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.utils.timezone import now, make_aware
from django.views.decorators.cache import cache_page
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from gspread.utils import extract_id_from_url  # type: ignore
from openpyxl.writer.excel import save_virtual_workbook  # type: ignore
from requests import HTTPError
from rest_framework import routers, filters, viewsets, serializers, permissions, status
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from iaso.api.common import (
    CSVExportMixin,
    ModelViewSet,
    DeletionFilterBackend,
    CONTENT_TYPE_XLSX,
    CONTENT_TYPE_CSV,
)
from iaso.models import OrgUnit
from plugins.polio.serializers import (
    ConfigSerializer,
    CountryUsersGroupSerializer,
    ExportCampaignSerializer,
)
from plugins.polio.serializers import (
    OrgUnitSerializer,
    CampaignSerializer,
    PreparednessPreviewSerializer,
    LineListImportSerializer,
    AnonymousCampaignSerializer,
    SmallCampaignSerializer,
    get_current_preparedness,
    CampaignGroupSerializer,
    serialize_campaign,
    log_campaign_modification,
    ListCampaignSerializer,
    CalendarCampaignSerializer,
)
from plugins.polio.serializers import SurgePreviewSerializer, CampaignPreparednessSpreadsheetSerializer
from .export_utils import generate_xlsx_campaigns_calendar, xlsx_file_name
from .forma import (
    FormAStocksViewSetV2,
    make_orgunits_cache,
    find_orgunit_in_cache,
)
from .helpers import get_url_content, CustomFilterBackend
from .vaccines_email import send_vaccines_notification_email
from .models import (
    Campaign,
    Config,
    LineListImport,
    Round,
    CampaignGroup,
    CampaignScope,
    RoundScope,
)
from .models import CountryUsersGroup
from .preparedness.summary import get_or_set_preparedness_cache_for_round

logger = getLogger(__name__)

CACHE_VERSION = 7


class PolioOrgunitViewSet(ModelViewSet):
    """Org units API for Polio

    This API is use by polio plugin to fetch country related to an org unit. Read only

    GET /api/polio/orgunits
    """

    results_key = "results"
    permission_classes = [permissions.IsAuthenticated]
    remove_results_key_if_paginated = True
    http_method_names = ["get"]

    def get_serializer_class(self):
        return OrgUnitSerializer

    def get_queryset(self):
        queryset = OrgUnit.objects.filter_for_user_and_app_id(
            self.request.user, self.request.query_params.get("app_id")
        )
        order = self.request.GET.get("order", "name").split(",")
        org_unit_parent_id = self.request.GET.get("orgUnitParentId", None)
        org_unit_type_category = self.request.GET.get("orgUnitTypeCategory", None)
        validation_status = self.request.GET.get("validationStatus", OrgUnit.VALIDATION_VALID)
        search = self.request.GET.get("search", None)

        if validation_status != "all":
            queryset = queryset.filter(validation_status=validation_status)
        if org_unit_parent_id:
            parent = OrgUnit.objects.get(id=org_unit_parent_id)
            queryset = queryset.hierarchy(parent)
        if org_unit_type_category:
            queryset = queryset.filter(org_unit_type__category=org_unit_type_category.upper())
        queryset = queryset.order_by(*order)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(aliases__contains=[search]))

        queryset = queryset.select_related("org_unit_type")
        queryset = queryset.prefetch_related("parent")
        return queryset.distinct()


class CampaignViewSet(ModelViewSet, CSVExportMixin):
    """Main endpoint for campaign.

    GET (Anonymously too)
    POST
    PATCH
    See swagger for Parameters
    """

    results_key = "campaigns"
    remove_results_key_if_paginated = True
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        CustomFilterBackend,
        DeletionFilterBackend,
    ]

    ordering_fields = [
        "obr_name",
        "cvdpv2_notified_at",
        "detection_status",
        "first_round_started_at",
        "last_round_started_at",
        "country__name",
    ]
    filterset_fields = {
        "country__name": ["exact"],
        "country__id": ["in"],
        "grouped_campaigns__id": ["in", "exact"],
        "obr_name": ["exact", "contains"],
        "cvdpv2_notified_at": ["gte", "lte", "range"],
        "created_at": ["gte", "lte", "range"],
        "rounds__started_at": ["gte", "lte", "range"],
    }

    # We allow anonymous read access for the embeddable calendar map view
    # in this case we use a restricted serializer with less field
    # notably not the url that we want to remain private.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    exporter_serializer_class = ExportCampaignSerializer
    export_filename = "campaigns_list_{date}.csv"
    use_field_order = False

    def get_serializer_class(self):
        if self.request.user.is_authenticated:
            if self.request.query_params.get("fieldset") == "list" and self.request.method in permissions.SAFE_METHODS:
                return ListCampaignSerializer
            if (
                self.request.query_params.get("fieldset") == "calendar"
                and self.request.method in permissions.SAFE_METHODS
            ):
                return CalendarCampaignSerializer

            return CampaignSerializer
        else:
            if (
                self.request.query_params.get("fieldset") == "calendar"
                and self.request.method in permissions.SAFE_METHODS
            ):
                return CalendarCampaignSerializer
            return AnonymousCampaignSerializer

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        if self.action in ("update", "partial_update", "retrieve", "destroy"):
            return queryset
        campaign_type = self.request.query_params.get("campaign_type")
        campaign_groups = self.request.query_params.get("campaign_groups")
        show_test = self.request.query_params.get("show_test", "false")
        org_unit_groups = self.request.query_params.get("org_unit_groups")

        campaigns = queryset
        if show_test == "false":
            campaigns = campaigns.filter(is_test=False)
        campaigns.prefetch_related("rounds", "group", "grouped_campaigns")
        if campaign_type == "preventive":
            campaigns = campaigns.filter(is_preventive=True)
        if campaign_type == "test":
            campaigns = campaigns.filter(is_test=True)
        if campaign_type == "regular":
            campaigns = campaigns.filter(is_preventive=False).filter(is_test=False)
        if campaign_groups:
            campaigns = campaigns.filter(grouped_campaigns__in=campaign_groups.split(","))
        if org_unit_groups:
            campaigns = campaigns.filter(country__groups__in=org_unit_groups.split(","))

        return campaigns.distinct()

    def get_queryset(self):
        user = self.request.user
        campaigns = Campaign.objects.all()

        # used for Ordering
        campaigns = campaigns.annotate(last_round_started_at=Max("rounds__started_at"))
        campaigns = campaigns.annotate(first_round_started_at=Min("rounds__started_at"))

        campaigns = campaigns.filter_for_user(user)
        if not self.request.user.is_authenticated:
            # For this endpoint since it's available anonymously we allow all user to list the campaigns
            # and to additionally filter on the account_id
            # In the future we may want to make the account_id parameter mandatory.
            account_id = self.request.query_params.get("account_id", None)
            if account_id is not None:
                campaigns = campaigns.filter(account_id=account_id)

        return campaigns

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

    @action(methods=["GET"], detail=False, serializer_class=None)
    def create_calendar_xlsx_sheet(self, request, **kwargs):
        current_date = request.query_params.get("currentDate")
        current_year = self.get_year(current_date)

        params = request.query_params
        calendar_data = self.get_calendar_data(current_year, params)
        filename = xlsx_file_name("calendar", params)
        xlsx_file = generate_xlsx_campaigns_calendar(filename, calendar_data)

        response = HttpResponse(
            save_virtual_workbook(xlsx_file),
            content_type=CONTENT_TYPE_XLSX,
        )
        response["Content-Disposition"] = "attachment; filename=%s" % filename + ".xlsx"
        return response

    @staticmethod
    def get_year(current_date):
        if current_date is not None:
            current_date = dt.datetime.strptime(current_date, "%Y-%m-%d")
            current_date = current_date.date()
            return current_date.year
        else:
            today = dt.date.today()
            return today.year

    def get_calendar_data(self: "CampaignViewSet", year: int, params: Any) -> Any:
        """
        Returns filtered rounds from database

            parameters:
                self: a self
                year (int): a year int
                params(dictionary): a params dictionary
            returns:
                rounds (array of dictionary): a rounds of array of dictionaries
        """
        countries = params.get("countries") if params.get("countries") is not None else None
        campaign_groups = params.get("campaignGroups") if params.get("campaignGroups") is not None else None
        campaign_type = params.get("campaignType") if params.get("campaignType") is not None else None
        search = params.get("search")
        org_unit_groups = params.get("orgUnitGroups") if params.get("orgUnitGroups") is not None else None

        rounds = Round.objects.filter(started_at__year=year)
        # Test campaigns should not appear in the xlsx calendar
        rounds = rounds.filter(campaign__is_test=False)
        if countries:
            rounds = rounds.filter(campaign__country_id__in=countries.split(","))
        if campaign_groups:
            rounds = rounds.filter(campaign__group_id__in=campaign_groups.split(","))
        if campaign_type == "preventive":
            rounds = rounds.filter(campaign__is_preventive=True)
        if campaign_type == "regular":
            rounds = rounds.filter(campaign__is_preventive=False).filter(campaign__is_test=False)
        if search:
            rounds = rounds.filter(Q(campaign__obr_name__icontains=search) | Q(campaign__epid__icontains=search))
        if org_unit_groups:
            rounds = rounds.filter(campaign__country__groups__in=org_unit_groups.split(","))

        return self.loop_on_rounds(self, rounds)

    @staticmethod
    def loop_on_rounds(self: "CampaignViewSet", rounds: Union[QuerySet, List[Round]]) -> list:
        """
        Returns formatted rounds

            parameters:
                self (CampaignViewSet): a self CampaignViewSet
                rounds(rounds queryset): rounds queryset
            returns:
                rounds (list): list of rounds
        """
        data_row: list = []
        for round in rounds:
            if round.campaign is not None:
                if round.campaign.country is not None:
                    campaign = round.campaign
                    country = campaign.country
                    if not any(d["country_id"] == country.id for d in data_row):
                        row = {"country_id": country.id, "country_name": country.name}
                        month = round.started_at.month
                        row["rounds"] = {}
                        row["rounds"][str(month)] = []
                        row["rounds"][str(month)].append(self.get_round(round, campaign, country))
                        data_row.append(row)
                    else:
                        row = [sub for sub in data_row if sub["country_id"] == country.id][0]
                        row_index = data_row.index(row)
                        if row is not None:
                            month = round.started_at.month
                            if str(month) in data_row[row_index]["rounds"]:
                                data_row[row_index]["rounds"][str(month)].append(
                                    self.get_round(round, campaign, country)
                                )
                            else:
                                data_row[row_index]["rounds"][str(month)] = []
                                data_row[row_index]["rounds"][str(month)].append(
                                    self.get_round(round, campaign, country)
                                )
        return data_row

    def get_round(self: "CampaignViewSet", round: Round, campaign: Campaign, country: OrgUnit) -> dict:
        started_at = dt.datetime.strftime(round.started_at, "%Y-%m-%d") if round.started_at is not None else None
        ended_at = dt.datetime.strftime(round.ended_at, "%Y-%m-%d") if round.ended_at is not None else None
        obr_name = campaign.obr_name if campaign.obr_name is not None else ""
        vacine = self.get_campain_vaccine(round, campaign)
        round_number = round.number if round.number is not None else ""
        # count all districts in the country
        country_districts_count = country.descendants().filter(org_unit_type__category="DISTRICT").count()
        # count disticts related to the round
        round_districts_count = campaign.get_districts_for_round_number(round_number).count() if round_number else 0
        districts_exists = country_districts_count > 0 and round_districts_count > 0
        # check if country districts is equal to round districts
        if districts_exists:
            nid_or_snid = "NID" if country_districts_count == round_districts_count else "sNID"
        else:
            nid_or_snid = ""

        # percentage target population
        percentage_covered_target_population = (
            round.percentage_covered_target_population if round.percentage_covered_target_population is not None else ""
        )

        # target population
        target_population = round.target_population if round.target_population is not None else ""

        return {
            "started_at": started_at,
            "ended_at": ended_at,
            "obr_name": obr_name,
            "vacine": vacine,
            "round_number": round_number,
            "percentage_covered_target_population": percentage_covered_target_population,
            "target_population": target_population,
            "nid_or_snid": nid_or_snid,
        }

    def get_campain_vaccine(self: "CampaignViewSet", round: Round, campain: Campaign) -> str:
        if campain.separate_scopes_per_round:
            round_scope_vaccines = []

            scopes = round.scopes
            if scopes.count() < 1:
                return ""
            # Loop on round scopes
            for scope in scopes.all():
                round_scope_vaccines.append(scope.vaccine)
            return ", ".join(round_scope_vaccines)
        else:
            if campain.vaccines:
                return campain.vaccines

            return ""

    @action(methods=["POST"], detail=True, serializer_class=CampaignPreparednessSpreadsheetSerializer)
    def create_preparedness_sheet(self, request: Request, pk=None, **kwargs):
        data = request.data
        data["campaign"] = pk
        serializer = CampaignPreparednessSpreadsheetSerializer(data=data)
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
        old_campaign_dump = serialize_campaign(campaign)
        country = campaign.country

        domain = settings.DNS_DOMAIN
        from_email = settings.DEFAULT_FROM_EMAIL

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
            from_email,
            emails,
        )
        campaign.creation_email_send_at = now()
        campaign.save()
        request_user = self.request.user
        log_campaign_modification(campaign, old_campaign_dump, request_user)

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
        methods=["GET", "HEAD"],  # type: ignore # HEAD is missing in djangorestframework-stubs
        detail=False,
        url_path="merged_shapes.geojson",
    )
    def shapes(self, request):
        """GeoJson, one geojson per campaign

        We use the django annotate feature to make a raw Postgis request that will generate the shape on the
        postgresql server which is faster.
        Campaign with and without scope per round are handled separately"""
        # FIXME: The cache ignore all the filter parameter which will return wrong result if used
        key_name = "{0}-geo_shapes".format(request.user.id)

        # use the same filter logic and rule as for anonymous or not
        campaigns = self.filter_queryset(self.get_queryset())
        # Remove deleted campaigns
        campaigns = campaigns.filter(deleted_at=None)

        # Determine last modification date to see if we invalidate the cache
        last_campaign_updated = campaigns.order_by("updated_at").last()
        last_roundscope_org_unit_updated = (
            OrgUnit.objects.order_by("updated_at").filter(groups__roundScope__round__campaign__in=campaigns).last()
        )
        last_org_unit_updated = (
            OrgUnit.objects.order_by("updated_at").filter(groups__campaignScope__campaign__in=campaigns).last()
        )

        update_dates = [
            last_org_unit_updated.updated_at if last_campaign_updated else None,
            last_roundscope_org_unit_updated.updated_at if last_roundscope_org_unit_updated else None,
            last_campaign_updated.updated_at if last_campaign_updated else None,
        ]
        cached_response = self.return_cached_response_if_valid(key_name, update_dates)
        if cached_response:
            return cached_response

        # noinspection SqlResolve
        round_scope_queryset = campaigns.filter(separate_scopes_per_round=True).annotate(
            geom=RawSQL(
                """select st_asgeojson(st_simplify(st_union(st_buffer(iaso_orgunit.simplified_geom::geometry, 0)), 0.01)::geography)
from iaso_orgunit
right join iaso_group_org_units ON iaso_group_org_units.orgunit_id = iaso_orgunit.id
right join polio_roundscope ON iaso_group_org_units.group_id =  polio_roundscope.group_id
right join polio_round ON polio_round.id = polio_roundscope.round_id
where polio_round.campaign_id = polio_campaign.id""",
                [],
            )
        )
        # For campaign scope
        # noinspection SqlResolve
        campain_scope_queryset = campaigns.filter(separate_scopes_per_round=False).annotate(
            geom=RawSQL(
                """select st_asgeojson(st_simplify(st_union(st_buffer(iaso_orgunit.simplified_geom::geometry, 0)), 0.01)::geography)
from iaso_orgunit
right join iaso_group_org_units ON iaso_group_org_units.orgunit_id = iaso_orgunit.id
right join polio_campaignscope ON iaso_group_org_units.group_id =  polio_campaignscope.group_id
where polio_campaignscope.campaign_id = polio_campaign.id""",
                [],
            )
        )

        features = []
        for queryset in (round_scope_queryset, campain_scope_queryset):
            for c in queryset:
                if c.geom:
                    s = SmallCampaignSerializer(c)
                    feature = {"type": "Feature", "geometry": json.loads(c.geom), "properties": s.data}
                    features.append(feature)
        res = {"type": "FeatureCollection", "features": features, "cache_creation_date": datetime.utcnow().timestamp()}

        cache.set(key_name, json.dumps(res), 3600 * 24, version=CACHE_VERSION)
        return JsonResponse(res)

    @staticmethod
    def return_cached_response_if_valid(cache_key, update_dates):
        cached_response = cache.get(cache_key, version=CACHE_VERSION)
        if not cached_response:
            return None
        parsed_cache_response = json.loads(cached_response)
        cache_creation_date = make_aware(datetime.utcfromtimestamp(parsed_cache_response["cache_creation_date"]))
        for update_date in update_dates:
            if update_date and update_date > cache_creation_date:
                return None
        return JsonResponse(json.loads(cached_response))

    @action(
        methods=["GET", "HEAD"],  # type: ignore # HEAD is missing in djangorestframework-stubs
        detail=False,
        url_path="v2/merged_shapes.geojson",
    )
    def shapes_v2(self, request):
        "Deprecated, should return the same format as shapes v3, kept for comparison"
        # FIXME: The cache ignore all the filter parameter which will return wrong result if used
        key_name = "{0}-geo_shapes_v2".format(request.user.id)

        campaigns = self.filter_queryset(self.get_queryset())
        # Remove deleted campaigns
        campaigns = campaigns.filter(deleted_at=None)

        last_campaign_updated = campaigns.order_by("updated_at").last()
        last_roundscope_org_unit_updated = (
            OrgUnit.objects.order_by("updated_at").filter(groups__roundScope__round__campaign__in=campaigns).last()
        )
        last_org_unit_updated = (
            OrgUnit.objects.order_by("updated_at").filter(groups__campaignScope__campaign__in=campaigns).last()
        )

        update_dates = [
            last_org_unit_updated.updated_at if last_org_unit_updated else None,
            last_roundscope_org_unit_updated.updated_at if last_roundscope_org_unit_updated else None,
            last_campaign_updated.updated_at if last_campaign_updated else None,
        ]
        cached_response = self.return_cached_response_if_valid(key_name, update_dates)
        if cached_response:
            return cached_response

        campaign_scopes = CampaignScope.objects.filter(campaign__in=campaigns.filter(separate_scopes_per_round=False))
        campaign_scopes = campaign_scopes.prefetch_related("campaign")
        campaign_scopes = campaign_scopes.prefetch_related("campaign__country")

        # noinspection SqlResolve
        campaign_scopes = campaign_scopes.annotate(
            geom=RawSQL(
                """SELECT st_asgeojson(st_simplify(st_union(st_buffer(iaso_orgunit.simplified_geom::geometry, 0)), 0.01)::geography)
from iaso_orgunit right join iaso_group_org_units ON iaso_group_org_units.orgunit_id = iaso_orgunit.id
where group_id = polio_campaignscope.group_id""",
                [],
            )
        )
        # Check if the campaigns have been updated since the response has been cached
        features = []
        scope: CampaignScope
        for scope in campaign_scopes:
            if scope.geom:
                feature = {
                    "type": "Feature",
                    "geometry": json.loads(scope.geom),
                    "properties": {
                        "obr_name": scope.campaign.obr_name,
                        "id": str(scope.campaign.id),
                        "vaccine": scope.vaccine,
                        "scope_key": f"campaignScope-{scope.id}",
                        "top_level_org_unit_name": scope.campaign.country.name,
                    },
                }
                features.append(feature)

        round_scopes = RoundScope.objects.filter(round__campaign__in=campaigns.filter(separate_scopes_per_round=True))
        round_scopes = round_scopes.prefetch_related("round__campaign")
        round_scopes = round_scopes.prefetch_related("round__campaign__country")
        # noinspection SqlResolve
        round_scopes = round_scopes.annotate(
            geom=RawSQL(
                """select st_asgeojson(st_simplify(st_union(st_buffer(iaso_orgunit.simplified_geom::geometry, 0)), 0.01)::geography)
from iaso_orgunit right join iaso_group_org_units ON iaso_group_org_units.orgunit_id = iaso_orgunit.id
where group_id = polio_roundscope.group_id""",
                [],
            )
        )

        scope: RoundScope
        for scope in round_scopes:
            if scope.geom:
                feature = {
                    "type": "Feature",
                    "geometry": json.loads(scope.geom),
                    "properties": {
                        "obr_name": scope.round.campaign.obr_name,
                        "id": str(scope.round.campaign.id),
                        "vaccine": scope.vaccine,
                        "scope_key": f"roundScope-{scope.id}",
                        "top_level_org_unit_name": scope.round.campaign.country.name,
                        "round_number": scope.round.number,
                    },
                }
                features.append(feature)

        res = {"type": "FeatureCollection", "features": features, "cache_creation_date": datetime.utcnow().timestamp()}

        cache.set(key_name, json.dumps(res), 3600 * 24, version=CACHE_VERSION)
        return JsonResponse(res)

    @action(
        methods=["GET", "HEAD"],  # type: ignore # HEAD is missing in djangorestframework-stubs
        detail=False,
        url_path="v3/merged_shapes.geojson",
    )
    def shapes_v3(self, request):
        campaigns = self.filter_queryset(self.get_queryset())
        # Remove deleted campaigns
        campaigns = campaigns.filter(deleted_at=None)
        campaigns = campaigns.only("geojson")
        features = []
        for c in campaigns:
            if c.geojson:
                features.extend(c.geojson)

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

    @swagger_auto_schema(request_body=no_body)
    @action(detail=False, methods=["get"], url_path="getsample")
    def download_sample_csv(self, request):
        return FileResponse(open("plugins/polio/fixtures/linelist_template.xls", "rb"))


class PreparednessDashboardViewSet(viewsets.ViewSet):
    def list(self, request):
        r = []
        qs = Campaign.objects.all().prefetch_related("rounds")
        if request.query_params.get("campaign"):
            qs = qs.filter(obr_name=request.query_params.get("campaign"))

        for c in qs:
            for round in c.rounds.all():
                p = get_or_set_preparedness_cache_for_round(c, round)
                if p:
                    r.append(p)
        return Response(r)


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


def handle_ona_request_with_key(request, key, country_id=None):
    as_csv = request.GET.get("format", None) == "csv"
    config = get_object_or_404(Config, slug=key)
    res = []
    failure_count = 0
    campaigns = Campaign.objects.all().filter(deleted_at=None)

    form_count = 0
    find_campaign_on_day_cached = functools.lru_cache(None)(find_campaign_on_day)
    stats = {
        "7days": {"ok": defaultdict(lambda: 0), "failure": defaultdict(lambda: 0)},
        "alltime": {"ok": defaultdict(lambda: 0), "failure": defaultdict(lambda: 0)},
    }
    for config in config.content:
        cid = int(country_id) if (country_id and country_id.isdigit()) else None
        if country_id is not None and config.get("country_id", None) != cid:
            continue

        country = OrgUnit.objects.get(id=config["country_id"])

        facilities = (
            OrgUnit.objects.hierarchy(country)
            .filter(org_unit_type_id__category="HF")
            .only("name", "id", "parent", "aliases")
            .prefetch_related("parent")
        )
        cache = make_orgunits_cache(facilities)
        logger.info(f"vaccines country cache len {len(cache)}")
        # Add fields to speed up detection of campaign day
        campaign_qs = campaigns.filter(country_id=country.id).annotate(
            last_start_date=Max("rounds__started_at"),
            start_date=Min("rounds__started_at"),
            end_date=Max("rounds__ended_at"),
        )

        # If all the country's campaigns has been over for more than five day, don't fetch submission from remote server
        # use cache
        last_campaign_date_agg = campaign_qs.aggregate(last_date=Max("end_date"))
        last_campaign_date: Optional[dt.date] = last_campaign_date_agg["last_date"]
        prefer_cache = last_campaign_date and (last_campaign_date + timedelta(days=5)) < dt.date.today()
        try:
            forms = get_url_content(
                url=config["url"],
                login=config["login"],
                password=config["password"],
                minutes=config.get("minutes", 60),
                prefer_cache=prefer_cache,
            )
        except HTTPError:
            # Send an email in case the WHO server returns an error.
            logger.exception(f"error refreshing ona data for {country.name}, skipping country")
            email_config = Config.objects.filter(slug="vaccines_emails").first()

            if email_config and email_config.content:
                emails = email_config.content
                send_vaccines_notification_email(config["login"], emails)
            continue
        logger.info(f"vaccines  {country.name}  forms: {len(forms)}")

        for form in forms:
            try:
                today_string = form["today"]
                today = datetime.strptime(today_string, "%Y-%m-%d").date()
                campaign = find_campaign_on_day_cached(campaign_qs, today)
                district_name = form.get("District", None)
                if not district_name:
                    district_name = form.get("district", "")
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

                success = form["facility_id"] != None and form["campaign_id"] != None
                stats_key = "ok" if success else "failure"
                stats["alltime"][stats_key][country.name] = stats["alltime"][stats_key][country.name] + 1
                if (datetime.utcnow().date() - today).days <= 7:
                    stats["7days"][stats_key][country.name] = stats["7days"][stats_key][country.name] + 1
            except Exception as e:
                logger.exception(f"failed parsing of {form}", exc_info=e)
                failure_count += 1
    print("parsed:", len(res), "failed:", failure_count)
    res = convert_dicts_to_table(res)

    if len(stats["7days"]["failure"]) > 1:  # let's send an email if there are recent failures
        email_text = "Forms not appearing in %s for the last 7 days \n" % key.upper()
        config = get_object_or_404(Config, slug="refresh_error_mailing_list")
        mails = config.content["mails"].split(",")  # format should be: {"mails": "a@a.b,b@b.a"}
        for country in stats["7days"]["failure"]:
            new_line = "\n%d\t%s" % (stats["7days"]["failure"][country], country)
            email_text += new_line
        email_text += "\n\nForms correctly handled in %s for the last 7 days\n" % key.upper()
        for country in stats["7days"]["ok"]:
            new_line = "\n%d\t%s" % (stats["7days"]["ok"][country], country)
            email_text += new_line
        send_mail(
            "Recent errors for %s" % (key.upper(),),
            email_text,
            settings.DEFAULT_FROM_EMAIL,
            mails,
        )
    if as_csv:
        response = HttpResponse(content_type=CONTENT_TYPE_CSV)
        writer = csv.writer(response)
        for item in res:
            writer.writerow(item)
        return response
    else:
        return JsonResponse(res, safe=False)


class VaccineStocksViewSet(viewsets.ViewSet):
    """
    Endpoint used to transform Vaccine Stocks data from existing ODK forms stored in ONA.
    sample config: [{"url": "https://afro.who.int/api/v1/data/yyy", "login": "d", "country": "hyrule", "password": "zeldarules", "country_id": 2115781}]
     A notification email can be automatically send for in case of login error by creating a config into polio under the name vaccines_emails.  The content must be an array of emails.
    """

    @method_decorator(cache_page(60 * 60 * 1))  # cache result for one hour
    def list(self, request):
        return handle_ona_request_with_key(request, "vaccines")

    @method_decorator(cache_page(60 * 60 * 1))  # cache result for one hour
    def retrieve(self, request, pk=None):
        return handle_ona_request_with_key(request, "vaccines", country_id=pk)


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
            districts = campaign.get_all_districts()

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
            response = HttpResponse(content_type=CONTENT_TYPE_CSV)
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
def add_nfm_stats_for_rounds(campaign_stats, nfm_stats, kind: str):
    assert kind in ["nfm_stats", "nfm_abs_stats"]
    for campaign, stats in campaign_stats.items():
        for round_number, round_stats in stats["rounds"].items():
            for district, district_stats in round_stats["data"].items():
                if district_stats["total_child_checked"] == 60:
                    for reason, count in nfm_stats[campaign][round_number][district].items():
                        round_stats[kind][reason] += count
    return campaign_stats


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

        campaigns = Campaign.objects.filter(country_id=requested_country).filter(is_test=False)
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


class CampaignGroupSearchFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get("search")

        if search:
            queryset = queryset.filter(Q(campaigns__obr_name__icontains=search) | Q(name__icontains=search)).distinct()
        return queryset


class CampaignGroupViewSet(ModelViewSet):
    results_key = "results"
    queryset = CampaignGroup.objects.all()
    serializer_class = CampaignGroupSerializer

    # We allow anonymous read access for the embeddable calendar map view
    # in this case we use a restricted serializer with less field
    # notably not the url that we want to remain private.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        CampaignGroupSearchFilterBackend,
        DeletionFilterBackend,
    ]
    ordering_fields = ["id", "name", "created_at", "updated_at"]
    filterset_fields = {
        "name": ["icontains"],
    }


@swagger_auto_schema(tags=["polio-configs"])
class ConfigViewSet(ModelViewSet):
    http_method_names = ["get"]
    serializer_class = ConfigSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Config.objects.filter(users=self.request.user)


router = routers.SimpleRouter()
router.register(r"polio/orgunits", PolioOrgunitViewSet, basename="PolioOrgunit")
router.register(r"polio/campaigns", CampaignViewSet, basename="Campaign")
from .budget.api import BudgetCampaignViewSet, BudgetStepViewSet, WorkflowViewSet

router.register(r"polio/budget", BudgetCampaignViewSet, basename="BudgetCampaign")
router.register(r"polio/budgetsteps", BudgetStepViewSet, basename="BudgetStep")
router.register(r"polio/workflow", WorkflowViewSet, basename="BudgetWorkflow")
router.register(r"polio/campaignsgroup", CampaignGroupViewSet, basename="campaigngroup")
router.register(r"polio/preparedness_dashboard", PreparednessDashboardViewSet, basename="preparedness_dashboard")
router.register(r"polio/imstats", IMStatsViewSet, basename="imstats")
router.register(r"polio/lqasstats", LQASStatsViewSet, basename="lqasstats")
router.register(r"polio/vaccines", VaccineStocksViewSet, basename="vaccines")
router.register(r"polio/forma", FormAStocksViewSet, basename="forma")
router.register(r"polio/v2/forma", FormAStocksViewSetV2, basename="forma")
router.register(r"polio/countryusersgroup", CountryUsersGroupViewSet, basename="countryusersgroup")
router.register(r"polio/linelistimport", LineListImportViewSet, basename="linelistimport")
router.register(r"polio/orgunitspercampaign", OrgUnitsPerCampaignViewset, basename="orgunitspercampaign")
router.register(r"polio/configs", ConfigViewSet, basename="polioconfigs")
