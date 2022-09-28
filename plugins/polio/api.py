import csv
import functools
import json
from datetime import timedelta, datetime, date
import string
from datetime import timedelta, datetime
import logging
from typing import Any, Dict, List, Optional, Union
from collections import defaultdict
from functools import lru_cache
from logging import getLogger
from io import BytesIO
from tempfile import NamedTemporaryFile

import openpyxl
from django.core.files import File
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import EmailMultiAlternatives
from django.core.mail import send_mail
from django.db.models import Q, Max, Min
from django.db.models import Value, TextField, UUIDField
from django.contrib.auth.models import User
from django.db.models.expressions import RawSQL
from django.http import HttpResponse
from django.http import JsonResponse
from django.http.response import HttpResponseBadRequest
from django.shortcuts import get_object_or_404
from django.utils.timezone import now, make_aware
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from django.template.loader import render_to_string
from gspread.utils import extract_id_from_url  # type: ignore
from hat.settings import DEFAULT_FROM_EMAIL
from rest_framework import routers, filters, viewsets, serializers, permissions, status
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from django.conf import settings
from hat.api.token_authentication import generate_auto_authentication_link
from iaso.api.common import ModelViewSet, DeletionFilterBackend
from iaso.models import OrgUnit
from iaso.models.microplanning import Team
from iaso.models.org_unit import OrgUnitType
from plugins.polio.serializers import (
    OrgUnitSerializer,
    CampaignSerializer,
    PreparednessPreviewSerializer,
    LineListImportSerializer,
    AnonymousCampaignSerializer,
    SmallCampaignSerializer,
    get_current_preparedness,
    CampaignGroupSerializer,
    BudgetEventSerializer,
    BudgetFilesSerializer,
    serialize_campaign,
    log_campaign_modification,
    CampaignFormTemplateSerializer,
)
from plugins.polio.serializers import (
    CountryUsersGroupSerializer,
)
from plugins.polio.serializers import SurgePreviewSerializer, CampaignPreparednessSpreadsheetSerializer
from .forma import (
    FormAStocksViewSetV2,
    make_orgunits_cache,
    find_orgunit_in_cache,
)
from .helpers import get_url_content
from .models import (
    Campaign,
    Config,
    LineListImport,
    SpreadSheetImport,
    Round,
    CampaignGroup,
    BudgetEvent,
    BudgetFiles,
    CampaignScope,
    RoundScope,
    CampaignFormTemplate,
)
from .models import CountryUsersGroup
from .models import URLCache
from .preparedness.calculator import preparedness_summary
from .preparedness.parser import get_preparedness

logger = getLogger(__name__)

CACHE_VERSION = 7


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
        return OrgUnit.objects.filter_for_user_and_app_id(self.request.user, self.request.query_params.get("app_id"))


class CampaignViewSet(ModelViewSet):
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
        "last_budget_event__created_at",
        "last_budget_event__type",
        "last_budget_event__status",
    ]
    filterset_fields = {
        "last_budget_event__status": ["exact"],
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

    def get_serializer_class(self):
        if self.request.user.is_authenticated:
            return CampaignSerializer
        else:
            return AnonymousCampaignSerializer

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        if self.action in ("update", "partial_update", "retrieve", "destroy"):
            return queryset
        campaign_type = self.request.query_params.get("campaign_type")
        campaign_groups = self.request.query_params.get("campaign_groups")
        show_test = self.request.query_params.get("show_test", "false")
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
        return campaigns.distinct()

    def get_queryset(self):
        user = self.request.user
        campaigns = Campaign.objects.all()

        # used for Ordering
        campaigns = campaigns.annotate(last_round_started_at=Max("rounds__started_at"))
        campaigns = campaigns.annotate(first_round_started_at=Min("rounds__started_at"))

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
        methods=["GET", "HEAD"],
        detail=False,
        url_path="merged_shapes.geojson",
    )
    def shapes(self, request):
        """GeoJson, one geojson per campaign

        We use the django annotate feature to make a raw Postgis request that will generate the shape on the
        postgresql server which is faster.
        Campaign with and without scope per round are  handled separately"""
        # FIXME: The cache ignore all the filter parameter which will return wrong result if used
        key_name = "{0}-geo_shapes".format(request.user.id)
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

        round_scope_queryset = campaigns.filter(separate_scopes_per_round=True).annotate(
            geom=RawSQL(
                """select st_asgeojson(st_simplify(st_union(st_buffer(iaso_orgunit.geom::geometry, 0)), 0.01)::geography)
from iaso_orgunit
right join iaso_group_org_units ON iaso_group_org_units.orgunit_id = iaso_orgunit.id
right join polio_roundscope ON iaso_group_org_units.group_id =  polio_roundscope.group_id
right join polio_round ON polio_round.id = polio_roundscope.round_id
where polio_round.campaign_id = polio_campaign.id""",
                [],
            )
        )
        # For campaign scope
        campain_scope_queryset = campaigns.filter(separate_scopes_per_round=False).annotate(
            geom=RawSQL(
                """select st_asgeojson(st_simplify(st_union(st_buffer(iaso_orgunit.geom::geometry, 0)), 0.01)::geography)
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
        methods=["GET", "HEAD"],
        detail=False,
        url_path="v2/merged_shapes.geojson",
    )
    def shapes_v2(self, request):
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
            last_org_unit_updated.updated_at if last_campaign_updated else None,
            last_roundscope_org_unit_updated.updated_at if last_roundscope_org_unit_updated else None,
            last_campaign_updated.updated_at if last_campaign_updated else None,
        ]
        cached_response = self.return_cached_response_if_valid(key_name, update_dates)
        if cached_response:
            return cached_response

        campaign_scopes = CampaignScope.objects.filter(campaign__in=campaigns.filter(separate_scopes_per_round=False))
        campaign_scopes = campaign_scopes.prefetch_related("campaign")
        campaign_scopes = campaign_scopes.prefetch_related("campaign__country")
        campaign_scopes = campaign_scopes.annotate(
            geom=RawSQL(
                """select st_asgeojson(st_simplify(st_union(st_buffer(iaso_orgunit.geom::geometry, 0)), 0.01)::geography)
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
        round_scopes = round_scopes.annotate(
            geom=RawSQL(
                """select st_asgeojson(st_simplify(st_union(st_buffer(iaso_orgunit.geom::geometry, 0)), 0.01)::geography)
from iaso_orgunit right join iaso_group_org_units ON iaso_group_org_units.orgunit_id = iaso_orgunit.id
where group_id = polio_roundscope.group_id""",
                [],
            )
        )

        for scope in round_scopes:
            scope: RoundScope
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

    @action(methods=["GET", "POST"], detail=False)
    def generate_xlsform(self, request):
        """
        Export a xlsform out of a campaign. A template is required. Specific data can be extracted from campaigns by
        starting the name variable by 'survey_' in the xls file in "calculate" row. The data will be saved in the
        calculation column.
        """
        campaign_id = request.query_params.get("id", None)
        campaign = get_object_or_404(Campaign, id=campaign_id)
        campaign_scope = get_object_or_404(CampaignScope, campaign=campaign).group.org_units.all()
        form_name = request.query_params.get("form_name", None)

        authorized_fields = [
            "id",
            "epid",
            "obr_name",
            "gpei_email",
            "description",
            "creation_email_send_at",
            "onset_at",
            "three_level_call_at",
            "cvdpv_notified_at",
            "cvdpv2_notified_at",
            "pv_notified_at",
            "pv2_notified_at",
            "virus",
            "detection_status",
            "detection_responsible",
            "detection_first_draft_submitted_at",
            "detection_rrt_oprtt_approval_at",
            "risk_assessment_status",
            "risk_assessment_responsible",
            "investigation_at",
            "risk_assessment_first_draft_submitted_at",
            "risk_assessment_rrt_oprtt_approval_at",
            "ag_nopv_group_met_at",
            "dg_authorized_at",
            "verification_score",
            "doses_requested",
            "preperadness_spreadsheet_url",
            "preperadness_sync_status",
            "surge_spreadsheet_url",
            "country_name_in_surge_spreadsheet",
            "budget_status",
            "budget_responsible",
            "created_at",
            "updated_at",
            "district_count",
            "round_pne",
            "round_two",
            "vacine",
        ]

        try:
            path = CampaignFormTemplate.objects.get(name=form_name).form_template.path
        except ValueError:
            raise serializers.ValidationError({"error": f"No template form is linked to the campaign {campaign}."})

        wb = openpyxl.load_workbook(path)
        sheet = wb.get_sheet_by_name("choices")
        choices_row = 2
        choices_column = 1
        cell = list(string.ascii_uppercase)
        q_sheet = wb.get_sheet_by_name("survey")
        survey_columns = []
        survey_last_empty_row = len(list(q_sheet.rows))
        for l in cell:
            survey_columns.append(q_sheet[f"{l}1"].value)

        ou_tree_list = []

        # create dictionary with OU tree
        for ou in campaign_scope:
            ou_tree_dict = {ou.org_unit_type.name: ou}
            ou_parent = ou.parent
            if ou_parent is not None:
                ou_tree_dict[ou_parent.org_unit_type.name] = ou_parent
            while ou_parent is not None:
                ou_tree_dict[ou_parent.org_unit_type.name] = ou_parent
                ou_parent = ou_parent.parent
                if ou_parent is not None:
                    ou_tree_dict[ou_parent.org_unit_type.name] = ou_parent
            ou_tree_list.append(ou_tree_dict)
            ou_children = ou.descendants()
            for ou_child in ou_children:
                ou_tree_dict[ou_child.org_unit_type.name] = ou_child

        added_countries = []
        added_regions = []
        added_district = []
        added_facilities = []
        region_added = False
        district_added = False
        facility_added = False

        # create xls column
        sheet[cell[choices_column - 1] + "1"] = "list name"
        sheet[cell[choices_column] + "1"] = "name"
        sheet[cell[choices_column + 1] + "1"] = "label"
        sheet[cell[choices_column + 2] + "1"] = "id"
        sheet[cell[choices_column + 3] + "1"] = "country"
        sheet[cell[choices_column + 4] + "1"] = "region"
        sheet[cell[choices_column + 5] + "1"] = "district"
        sheet[cell[choices_column + 6] + "1"] = "health facility"

        # populate csv with OU
        for ou_dic in ou_tree_list:
            for k, v in ou_dic.items():
                if k == "COUNTRY" and v not in added_countries:
                    added_countries.append(v)
                    q_sheet[cell[0] + str(16)] = "select_one ou_country"
                    q_sheet[cell[1] + str(16)] = "ou_country"
                    q_sheet[cell[2] + str(16)] = "Select Country"
                    q_sheet[cell[3] + str(16)] = "yes"
                    sheet[cell[choices_column - 1] + str(choices_row)] = "ou_country"
                    sheet[cell[choices_column] + str(choices_row)] = v.id
                    sheet[cell[choices_column + 1] + str(choices_row)] = str(v.name)
                    choices_row += 1
                    survey_last_empty_row += 1
                if k == "REGION" and v not in added_regions:
                    survey_last_empty_row += 2
                    added_regions.append(v)
                    if not region_added:
                        q_sheet[cell[0] + str(17)] = "select_one ou_region"
                        q_sheet[cell[1] + str(17)] = "ou_region"
                        q_sheet[cell[2] + str(17)] = "Select a Region"
                        q_sheet[cell[9] + str(17)] = "country=${ou_country}"
                        region_added = True
                    sheet[cell[choices_column - 1] + str(choices_row)] = "ou_region"
                    sheet[cell[choices_column] + str(choices_row)] = v.id
                    sheet[cell[choices_column + 1] + str(choices_row)] = str(v.name)
                    sheet[cell[choices_column + 3] + str(choices_row)] = (
                        ou_dic.get("COUNTRY", None)
                        if ou_dic.get("COUNTRY", None) is None
                        else ou_dic.get("COUNTRY", None).pk
                    )
                    choices_row += 1
                    survey_last_empty_row += 1

                if k == "DISTRICT" and v not in added_district:
                    survey_last_empty_row += 4
                    added_district.append(v)
                    if not district_added:
                        q_sheet[cell[0] + str(18)] = "select_one ou_district"
                        q_sheet[cell[1] + str(18)] = "ou_district"
                        q_sheet[cell[2] + str(18)] = "Select a District"
                        q_sheet[cell[9] + str(18)] = "region=${ou_region}"
                        district_added = True
                    sheet[cell[choices_column - 1] + str(choices_row)] = "ou_district"
                    sheet[cell[choices_column] + str(choices_row)] = v.id
                    sheet[cell[choices_column + 1] + str(choices_row)] = str(v.name)
                    sheet[cell[choices_column + 3] + str(choices_row)] = (
                        ou_dic.get("COUNTRY", None)
                        if ou_dic.get("COUNTRY", None) is None
                        else ou_dic.get("COUNTRY", None).pk
                    )
                    sheet[cell[choices_column + 4] + str(choices_row)] = (
                        ou_dic.get("REGION", None)
                        if ou_dic.get("REGION", None) is None
                        else ou_dic.get("REGION", None).pk
                    )
                    choices_row += 1
                    survey_last_empty_row += 1

                if k == "HEALTH FACILITY" and v not in added_facilities:
                    survey_last_empty_row += 6
                    added_facilities.append(v)
                    if not facility_added:
                        q_sheet[cell[0] + str(19)] = "select_one ou_facility"
                        q_sheet[cell[1] + str(19)] = "ou_facility"
                        q_sheet[cell[2] + str(19)] = "Select a Health Facility"
                        q_sheet[cell[9] + str(19)] = "district=${ou_district}"
                        district_added = True
                    sheet[cell[choices_column - 1] + str(choices_row)] = ""
                    sheet[cell[choices_column] + str(choices_row)] = v.id
                    sheet[cell[choices_column + 1] + str(choices_row)] = str(v.name)
                    sheet[cell[choices_column + 3] + str(choices_row)] = (
                        ou_dic.get("COUNTRY", None)
                        if ou_dic.get("COUNTRY", None) is None
                        else ou_dic.get("COUNTRY", None).pk
                    )
                    sheet[cell[choices_column + 4] + str(choices_row)] = (
                        ou_dic.get("REGION", None)
                        if ou_dic.get("REGION", None) is None
                        else ou_dic.get("REGION", None).pk
                    )
                    sheet[cell[choices_column + 5] + str(choices_row)] = (
                        ou_dic.get("DISTRICT", None)
                        if ou_dic.get("DISTRICT", None) is None
                        else ou_dic.get("DISTRICT", None).name
                    )
                    choices_row += 1
                    survey_last_empty_row += 1

        # Add default data to the xlsform
        row = q_sheet.max_row

        q_sheet[cell[0] + str(11)] = "note"
        q_sheet[cell[1] + str(11)] = "note_obr_name"
        q_sheet[cell[2] + str(11)] = f"Outbreak Name: {campaign.obr_name} "

        number_of_round = 0 if campaign.round_one is None else 1
        number_of_round = number_of_round if campaign.round_two is None else 2
        q_sheet[cell[0] + str(12)] = "note"
        q_sheet[cell[1] + str(12)] = "note_round_number"
        q_sheet[cell[2] + str(12)] = f"Number of rounds: {number_of_round} "

        q_sheet[cell[0] + str(13)] = "note"
        q_sheet[cell[1] + str(13)] = "note_first_round_date"
        if campaign.round_one is not None:
            q_sheet[cell[2] + str(13)] = f"First Round Date: {campaign.round_one.started_at} "
        else:
            q_sheet[cell[2] + str(13)] = f"First Round Date: {None}"
        q_sheet[cell[0] + str(14)] = "note"
        q_sheet[cell[1] + str(14)] = "note_vaccine_type"
        q_sheet[cell[2] + str(14)] = f"Vaccine Type: {campaign.vacine} "

        # Get Calculation column position
        calculation_index = 0
        for row_calc in q_sheet.rows:
            iterator = 0
            for cell in row_calc:
                iterator += 1
                if cell.value == "calculation":
                    calculation_index = iterator
                    break

        # Insert data as calculation
        for i in range(2, row + 1):
            cell_obj = q_sheet.cell(row=i, column=2)
            cell_value_start = cell_obj.value[:7] if cell_obj.value is not None else ""
            if cell_value_start == "survey_":
                str_request = cell_obj.value[7:]
                if str_request in authorized_fields:
                    cell_obj = q_sheet.cell(row=i, column=calculation_index)
                    cell_obj.value = str(getattr(campaign, str_request))

        filename = f"FORM_{campaign.obr_name}_{datetime.now().date()}.xlsx"

        with NamedTemporaryFile() as tmp:
            wb.save(tmp.name)
            tmp.seek(0)
            stream = tmp.read()

            response = HttpResponse(
                stream, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            response["Content-Disposition"] = "attachment; filename=%s" % filename
            return response


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


def _make_prep(c: Campaign, round: Round):
    url = round.preparedness_spreadsheet_url
    if not url:
        return None
    campaign_prep = {
        "campaign_id": c.id,
        "campaign_obr_name": c.obr_name,
        "indicators": {},
        "round": f"Round{round.number}",
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
            return campaign_prep
        campaign_prep["date"] = ssi_qs.last().created_at
        cs = ssi_qs.last().cached_spreadsheet
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


class PreparednessDashboardViewSet(viewsets.ViewSet):
    def list(self, request):

        r = []
        qs = Campaign.objects.all()
        if request.query_params.get("campaign"):
            qs = qs.filter(obr_name=request.query_params.get("campaign"))

        for c in qs:
            for round in c.rounds.all():
                p = _make_prep(c, round)
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
            forms = get_url_content(country_config["url"], country_config["login"], country_config["password"])
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


def handle_ona_request_with_key(request, key):
    as_csv = request.GET.get("format", None) == "csv"
    config = get_object_or_404(Config, slug=key)
    res = []
    failure_count = 0
    campaigns = Campaign.objects.all().filter(deleted_at=None)

    form_count = 0
    find_campaign_on_day_cached = functools.lru_cache(None)(find_campaign_on_day)
    for config in config.content:
        forms = get_url_content(
            url=config["url"], login=config["login"], password=config["password"], minutes=config.get("minutes", 60)
        )
        country = OrgUnit.objects.get(id=config["country_id"])
        facilities = (
            OrgUnit.objects.hierarchy(country)
            .filter(org_unit_type_id__category="HF")
            .only("name", "id", "parent", "aliases")
            .prefetch_related("parent")
        )
        cache = make_orgunits_cache(facilities)
        # Add fields to speed up detection of campaign day
        campaign_qs = campaigns.filter(country_id=country.id).annotate(
            last_start_date=Max("rounds__started_at"),
            start_date=Min("rounds__started_at"),
            end_date=Max("rounds__ended_at"),
        )

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
            except Exception as e:
                logger.exception(f"failed parsing of {form}", exc_info=e)
                failure_count += 1
    print("parsed:", len(res), "failed:", failure_count)
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


class HasPoliobudgetPermission(permissions.BasePermission):
    def has_permission(self, request, view) -> bool:
        if not request.user.has_perm("menupermissions.iaso_polio_budget"):
            return False
        return True


def email_subject(event_type: str, campaign_name: str) -> str:
    email_subject_template = "New {} for {}"
    return email_subject_template.format(event_type, campaign_name)


def event_creation_email(
    event_type: str, first_name: str, last_name: str, comment: str, file: str, links: str, link: str, dns_domain: str
) -> str:
    email_template = """%s by %s %s.

Comment: %s

Files: %s

Links: %s

------------

you can access the history of this budget here: %s

------------    
This is an automated email from %s
"""
    return email_template % (event_type, first_name, last_name, comment, file, links, link, dns_domain)


def creation_email_with_two_links(
    event_type: str,
    first_name: str,
    last_name: str,
    comment: Optional[str],
    files: str,
    links: Optional[str],
    validation_link: str,
    rejection_link: str,
    dns_domain: str,
) -> str:
    email_template = """%s by %s %s.

Comment: %s

Files:  %s

Links: %s

------------

you can validate the budget here: %s

you can reject and add a comment here : %s

------------    
This is an automated email from %s
"""
    return email_template % (
        event_type,
        first_name,
        last_name,
        comment,
        files,
        links,
        validation_link,
        rejection_link,
        dns_domain,
    )


def budget_approval_email_subject(campaign_name: str) -> str:
    email_subject_validation_template = "APPROVED: Budget For Campaign {}"
    return email_subject_validation_template.format(campaign_name)


def budget_approval_email(campaign_name: str, link: str, dns_domain: str) -> str:
    email_template = """
            
                    The budget for campaign {0} has been approved.
                    Click here to see the details :
                    {1}
            
                    ------------
                    This is an automated email from {2}
                    """
    return email_template.format(campaign_name, link, dns_domain)


def send_approval_budget_mail(event: BudgetEvent) -> None:
    mails_list = list()
    events = BudgetEvent.objects.filter(campaign=event.campaign)
    link_to_send = "https://%s/dashboard/polio/budget/details/campaignId/%s/campaignName/%s/country/%d" % (
        settings.DNS_DOMAIN,
        event.campaign.id,
        event.campaign.obr_name,
        event.campaign.country.id,
    )
    subject = budget_approval_email_subject(event.campaign.obr_name)
    for e in events:
        teams = e.target_teams.all()
        for team in teams:
            for user in team.users.all():
                if user.email not in mails_list:
                    mails_list.append(user.email)
                    text_content = budget_approval_email(
                        event.campaign.obr_name,
                        generate_auto_authentication_link(link_to_send, user),
                        settings.DNS_DOMAIN,
                    )

                    msg = EmailMultiAlternatives(subject, text_content, DEFAULT_FROM_EMAIL, [user.email])
                    html_content = render_to_string(
                        "budget_approved_email.html",
                        {
                            "campaign": event.campaign.obr_name,
                            "LANGUAGE_CODE": user.iaso_profile.language,
                            "sender": settings.DNS_DOMAIN,
                            "link": generate_auto_authentication_link(link_to_send, user),
                        },
                    )
                    msg.attach_alternative(html_content, "text/html")
                    msg.send(fail_silently=False)


def send_approvers_email(
    user: User,
    author_team: Team,
    event: BudgetEvent,
    event_type: str,
    approval_link: str,
    rejection_link: str,
    files_info: Optional[List[Dict[str, Any]]],
    links_string: Optional[str],
) -> None:
    # if user is in other approval team, send the mail with the fat buttons
    subject = email_subject(event_type, event.campaign.obr_name)
    from_email = settings.DEFAULT_FROM_EMAIL
    files_string = "None"
    if files_info:
        files_string = ",\n ".join([f["path"] for f in files_info])
    links = None
    if links_string:
        links = links_string.split(",")
    auto_authentication_approval_link = generate_auto_authentication_link(approval_link, user)
    auto_authentication_rejection_link = generate_auto_authentication_link(rejection_link, user)
    text_content = creation_email_with_two_links(
        event.type,
        event.author.first_name,
        event.author.last_name,
        event.comment,
        files_string,
        links_string,
        auto_authentication_approval_link,
        auto_authentication_rejection_link,
        settings.DNS_DOMAIN,
    )
    msg = EmailMultiAlternatives(subject, text_content, from_email, [user.email])
    html_content = render_to_string(
        "validation_email.html",
        {
            "LANGUAGE_CODE": user.iaso_profile.language,
            "campaign": event.campaign.obr_name,
            "comment": event.comment,
            "author_first_name": event.author.first_name,
            "author_last_name": event.author.last_name,
            "validation_link": auto_authentication_approval_link,
            "rejection_link": auto_authentication_rejection_link,
            "team": author_team.name,
            "sender": settings.DNS_DOMAIN,
            "event_type": event_type,
            "files": files_info,
            "links": links,
        },
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)


def send_approval_confirmation_to_users(event: BudgetEvent) -> None:
    # modify campaign.budget_status instead of event.status
    event.status = "validated"
    event.save()
    send_approval_budget_mail(event)


def is_budget_approved(user: User, event: BudgetEvent) -> bool:
    val_teams = (
        Team.objects.filter(name__icontains="approval")
        .filter(project__account=user.iaso_profile.account)
        .filter(deleted_at=None)
    )
    validation_count = 0
    for val_team in val_teams:
        for user in val_team.users.all():
            try:
                count = BudgetEvent.objects.filter(author=user, campaign=event.campaign, type="validation").count()
                if count > 0:
                    validation_count += 1
                    break
            except ObjectDoesNotExist:
                pass
    if validation_count == val_teams.count():
        return True
    return False


def format_file_link(event_file: BudgetFiles) -> Dict[str, str]:
    serialized_file = BudgetFilesSerializer(event_file).data
    return {"path": serialized_file["file"], "name": event_file.file.name}


def make_budget_event_file_links(event: BudgetEvent) -> Optional[List[Dict[str, str]]]:
    event_files = event.event_files.all()
    if not event_files:
        return None
    return [format_file_link(f) for f in event_files]


class RecipientFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        recipient = request.query_params.get("recipient")
        if recipient:
            queryset = queryset.filter(target_teams__in=[int(recipient)])
        return queryset


class BudgetEventTypeFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        type = request.query_params.get("type", "all")
        if type == "all":
            return queryset
        else:
            return queryset.filter(type=type)


class SenderTeamFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        sender_team_id = request.query_params.get("senderTeam")
        if sender_team_id:
            try:
                sender_team = Team.objects.get(id=int(sender_team_id))
                queryset = queryset.filter(author__in=list(sender_team.users.all()))
            except:
                logging.debug("No team found for id ", sender_team_id)

        return queryset


class BudgetEventViewset(ModelViewSet):
    result_key = "results"
    remove_results_key_if_paginated = True
    serializer_class = BudgetEventSerializer
    permission_classes = [permissions.IsAuthenticated, HasPoliobudgetPermission]
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        BudgetEventTypeFilterBackend,
        RecipientFilterBackend,
        SenderTeamFilterBackend,
    ]
    ordering_fields = [
        "created_at",
        "updated_at",
        "type",
        "author",
    ]

    def get_serializer_class(self):
        return BudgetEventSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = BudgetEvent.objects.filter(author__iaso_profile__account=self.request.user.iaso_profile.account)
        show_non_internals = Q(internal=False)
        show_internals = Q(internal=True) & (Q(author=user) | Q(target_teams__users=user))
        queryset = queryset.filter(show_internals | show_non_internals)
        show_deleted = self.request.query_params.get("show_deleted")
        if show_deleted == "false":
            queryset = queryset.filter(deleted_at=None)
        campaign_id = self.request.query_params.get("campaign_id")
        if campaign_id is not None:
            queryset = queryset.filter(campaign_id=campaign_id)
        return queryset.distinct()

    def perform_create(self, serializer):
        # block event creation if user is not part of a team
        if not self.request.user.iaso_profile.has_a_team():
            raise serializers.ValidationError({"general": ["userWithoutTeam"]})
        event = serializer.save(author=self.request.user)
        serializer = BudgetEventSerializer(event, many=False)
        return Response(serializer.data)

    @action(methods=["PUT"], detail=False, serializer_class=BudgetEventSerializer)
    def confirm_budget(self, request):
        if request.method == "PUT":
            event_pk = request.data["event"]
            event = BudgetEvent.objects.get(pk=event_pk)
            if not event.author.iaso_profile.has_a_team():
                raise serializers.ValidationError({"general": ["userWithoutTeam"]})
            event.is_finalized = True if request.data["is_finalized"] else False
            event.save()
            files_string = "None"
            files_info = make_budget_event_file_links(event)
            if files_info:
                files_string = ",\n ".join([f["path"] for f in files_info])

            current_user = self.request.user
            event_type = "approval" if event.type == "validation" else event.type

            if event.is_finalized and not event.is_email_sent:
                recipients = set()
                for team in event.target_teams.all():
                    for user in team.users.all():
                        if user.email:
                            recipients.add(user)

                link_to_send = "https://%s/dashboard/polio/budget/details/campaignId/%s/campaignName/%s/country/%d" % (
                    settings.DNS_DOMAIN,
                    event.campaign.id,
                    event.campaign.obr_name,
                    event.campaign.country.id,
                )
                approval_link = link_to_send + "/action/confirmApproval"
                rejection_link = link_to_send + "/action/addComment"
                # If other approval teams still have to approve the budget, notify their members with html email
                if event_type == "approval" and not is_budget_approved(current_user, event):
                    # We're assuming a user can only be in one approval team
                    author_team = event.author.teams.filter(name__icontains="approval").filter(deleted_at=None).first()
                    # if not author_team:
                    #     raise serializers.ValidationError({"general":"userWithoutTeam"})
                    other_approval_teams = (
                        Team.objects.filter(name__icontains="approval")
                        .exclude(id=author_team.id)
                        .filter(deleted_at=None)
                    )
                    approvers = other_approval_teams.values("users")

                    for approver in approvers:
                        user = User.objects.get(id=approver["users"])
                        send_approvers_email(
                            user, author_team, event, event_type, approval_link, rejection_link, files_info, event.links
                        )
                        # TODO check that this works
                        recipients.discard(user)
                # Send email with link to all approvers if event is a submission
                elif event_type == "submission" or event_type == "transmission":
                    author_team = event.author.teams.filter(name__icontains="approval").filter(deleted_at=None).first()
                    if not author_team:
                        author_team = event.author.teams.first()
                    # if not author_team:
                    #     raise serializers.ValidationError({"general":"userWithoutTeam"})
                    approval_teams = Team.objects.filter(name__icontains="approval").filter(deleted_at=None)
                    approvers = approval_teams.values("users")
                    for approver in approvers:
                        user = User.objects.get(id=approver["users"])
                        send_approvers_email(
                            user, author_team, event, event_type, approval_link, rejection_link, files_info, event.links
                        )
                        recipients.discard(user)
                for user in recipients:
                    subject = email_subject(event_type, event.campaign.obr_name)
                    text_content = event_creation_email(
                        event.type,
                        event.author.first_name,
                        event.author.last_name,
                        event.comment,
                        files_string,
                        event.links,
                        generate_auto_authentication_link(link_to_send, user),
                        settings.DNS_DOMAIN,
                    )
                    msg = EmailMultiAlternatives(subject, text_content, DEFAULT_FROM_EMAIL, [user.email])
                    links = event.links
                    if links:
                        links = links.split(",")
                    html_content = render_to_string(
                        "event_created_email.html",
                        {
                            "campaign": event.campaign.obr_name,
                            "LANGUAGE_CODE": user.iaso_profile.language,
                            "sender": settings.DNS_DOMAIN,
                            "link": generate_auto_authentication_link(link_to_send, user),
                            "first_name": event.author.first_name,
                            "last_name": event.author.last_name,
                            "comment": event.comment,
                            "event_type": event_type,
                            "files": files_info,
                            "links": links,
                        },
                    )
                    msg.attach_alternative(html_content, "text/html")
                    msg.send(fail_silently=False)

                event.is_email_sent = True
                event.save()
                # If the budget is approved as a results of the events creation, send the confirmation email as well
                if event_type == "approval" and is_budget_approved(current_user, event):
                    send_approval_confirmation_to_users(event)
            serializer = BudgetEventSerializer(event, many=False)
            return Response(serializer.data)

        event = BudgetEvent.objects.none()
        serializer = BudgetEventSerializer(event, many=False)
        return Response(serializer.data)

    def team_budget_validation(self, request):
        pass


class BudgetFilesViewset(ModelViewSet):
    results_key = "results"
    serializer_class = BudgetFilesSerializer
    remove_results_key_if_paginated = True
    permission_classes = [HasPoliobudgetPermission]

    def get_serializer_class(self):
        return BudgetFilesSerializer

    def get_queryset(self):
        queryset = BudgetFiles.objects.filter(
            event__author__iaso_profile__account=self.request.user.iaso_profile.account
        )
        event_id = self.request.query_params.get("event_id")
        if event_id is not None:
            queryset = queryset.filter(event_id=event_id)
        return queryset

    def create(self, request, *args, **kwargs):
        event = request.data["event"]
        event = get_object_or_404(BudgetEvent, id=event)
        for file in request.FILES.items():
            budget_file = BudgetFiles.objects.create(file=File(file[1]), event=event)
            budget_file.save()

        files = BudgetFiles.objects.filter(event__author__iaso_profile__account=self.request.user.iaso_profile.account)
        serializer = BudgetFilesSerializer(files, many=True)
        return Response(serializer.data)


class CampaignFormTemplateViewSet(ModelViewSet):
    results_key = "results"
    serializer_class = CampaignFormTemplateSerializer
    remove_results_key_if_paginated = True

    def get_queryset(self):
        queryset = CampaignFormTemplate.objects.filter(account=self.request.user.iaso_profile.account)
        return queryset

    def create(self, request, *args, **kwargs):
        name = request.data["name"]
        account = request.user.iaso_profile.account
        form_template = request.data["form_template"]

        return super().create(request, name, account, form_template)


router = routers.SimpleRouter()
router.register(r"polio/orgunits", PolioOrgunitViewSet, basename="PolioOrgunit")
router.register(r"polio/campaigns", CampaignViewSet, basename="Campaign")
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
router.register(r"polio/budgetevent", BudgetEventViewset, basename="budget")
router.register(r"polio/budgetfiles", BudgetFilesViewset, basename="budgetfiles")
router.register(r"polio/campaignformtemplate", CampaignFormTemplateViewSet, basename="campaigntemplateform")
