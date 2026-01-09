from datetime import datetime
from tempfile import NamedTemporaryFile
from time import gmtime, strftime
from typing import Any, List, Union

from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Max, Min, Prefetch, Q
from django.db.models.query import QuerySet
from django.http import HttpResponse, JsonResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from hat.api.export_utils import Echo, iter_items
from iaso.api.common import (
    CONTENT_TYPE_CSV,
    CONTENT_TYPE_XLSX,
    CustomFilterBackend,
    DeletionFilterBackend,
    ModelViewSet,
)
from iaso.models import OrgUnit
from plugins.polio.api.campaigns.campaigns_log import (
    log_campaign_modification,
    serialize_campaign,
)
from plugins.polio.api.campaigns.serializers.anonymous import AnonymousCampaignSerializer
from plugins.polio.api.campaigns.serializers.calendar import CalendarCampaignSerializer
from plugins.polio.api.campaigns.serializers.campaigns import CampaignSerializer
from plugins.polio.api.campaigns.serializers.list import ListCampaignSerializer
from plugins.polio.api.campaigns.serializers.retrieve import RetrieveCampaignSerializer
from plugins.polio.api.campaigns.serializers.shared import CampaignDropDownSerializer, CampaignTypeSerializer
from plugins.polio.api.preparedness.serializers import (
    CampaignPreparednessSpreadsheetSerializer,
    PreparednessPreviewSerializer,
)
from plugins.polio.api.preparedness.utils import get_current_preparedness
from plugins.polio.export_utils import generate_xlsx_campaigns_calendar, xlsx_file_name
from plugins.polio.models import (
    Campaign,
    CampaignType,
    CountryUsersGroup,
    Round,
)
from plugins.polio.preparedness.spreadsheet_manager import (
    Campaign,
)


class CampaignViewSet(ModelViewSet):
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
    export_filename = "campaigns_list_{date}.csv"
    use_field_order = False

    def get_serializer_class(self):
        if self.request.query_params.get("fieldset") == "calendar" and self.request.method in permissions.SAFE_METHODS:
            return CalendarCampaignSerializer
        if self.request.user.is_authenticated:
            if self.request.query_params.get("fieldset") == "list" and self.request.method in permissions.SAFE_METHODS:
                return ListCampaignSerializer
            if (
                self.request.query_params.get("fieldset") == "dropdown"
                and self.request.method in permissions.SAFE_METHODS
            ):
                return CampaignDropDownSerializer
            if self.action == "retrieve":
                return RetrieveCampaignSerializer
            return CampaignSerializer
        return AnonymousCampaignSerializer

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        if self.action in ("update", "partial_update", "retrieve", "destroy"):
            return queryset
        campaign_category = self.request.query_params.get("campaign_category")
        campaign_groups = self.request.query_params.get("campaign_groups")
        show_test = self.request.query_params.get("show_test", "false")
        on_hold = self.request.query_params.get("on_hold", "false")
        org_unit_groups = self.request.query_params.get("org_unit_groups")
        campaign_types = self.request.query_params.get("campaign_types")
        campaigns = queryset

        if show_test == "false":
            campaigns = campaigns.filter(is_test=False)
        if on_hold == "false":
            campaigns = campaigns.filter(on_hold=False)
        if campaign_category == "preventive":
            campaigns = campaigns.filter(is_preventive=True).filter(is_planned=False)
        if campaign_category == "on_hold":
            campaigns = campaigns.filter(on_hold=True).filter(is_planned=False)
        if campaign_category == "is_planned":
            campaigns = campaigns.filter(is_planned=True)
        if campaign_category == "regular" and on_hold == "true":
            campaigns = campaigns.filter(is_preventive=False).filter(is_test=False).filter(is_planned=False)
        if campaign_category == "regular" and on_hold == "false":
            campaigns = (
                campaigns.filter(is_preventive=False)
                .filter(is_test=False)
                .filter(on_hold=False)
                .filter(is_planned=False)
            )
        if campaign_groups:
            campaigns = campaigns.filter(grouped_campaigns__in=campaign_groups.split(","))
        if org_unit_groups:
            campaigns = campaigns.filter(country__groups__in=org_unit_groups.split(","))
        if campaign_types:
            campaign_types_list = campaign_types.split(",")
            if all(item.isdigit() for item in campaign_types_list):
                campaigns = campaigns.filter(campaign_types__id__in=campaign_types_list)
            else:
                campaigns = campaigns.filter(campaign_types__slug__in=campaign_types_list)
        org_units_id_only_qs = OrgUnit.objects.only("id", "name")
        country_prefetch = Prefetch("country", queryset=org_units_id_only_qs)
        scopes_group_org_units_prefetch = Prefetch("scopes__group__org_units", queryset=org_units_id_only_qs)
        rounds_scopes_group_org_units_prefetch = Prefetch(
            "rounds__scopes__group__org_units", queryset=org_units_id_only_qs
        )
        campaigns = (
            campaigns.prefetch_related(country_prefetch)
            .prefetch_related("grouped_campaigns")
            .prefetch_related("scopes")
            .prefetch_related("scopes__group")
            .prefetch_related(scopes_group_org_units_prefetch)
            .prefetch_related("rounds")
            .prefetch_related("rounds__datelogs")
            .prefetch_related("rounds__datelogs__modified_by")
            .prefetch_related("rounds__scopes")
            .prefetch_related("rounds__scopes__group")
            .prefetch_related(rounds_scopes_group_org_units_prefetch)
        )
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

    @action(detail=False, methods=["GET"], serializer_class=CampaignTypeSerializer)
    def available_campaign_types(self, request):
        campaign_types = CampaignType.objects.all()
        serializer = CampaignTypeSerializer(campaign_types, many=True)
        return Response(serializer.data)

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

        with NamedTemporaryFile() as tmp:
            xlsx_file.save(tmp.name)
            tmp.seek(0)
            stream = tmp.read()

        response = HttpResponse(stream, content_type=CONTENT_TYPE_XLSX)
        response["Content-Disposition"] = "attachment; filename=%s" % filename + ".xlsx"
        return response

    @action(methods=["GET"], detail=False, serializer_class=None)
    def create_all_rounds_scopes_csv(self, request, **kwargs):
        """
        It generates a csv export file with all round's related informations

            parameters:
                self: a self
                roundStartFrom: a date
                roundStartTo: a date
            returns:
                it generates a csv file export
        """
        round_start_from = request.GET.get("roundStartFrom")
        round_start_to = request.GET.get("roundStartTo")
        current_date = request.GET.get("currentDate")

        round_start_from = datetime.strptime(round_start_from, "%d-%m-%Y") if round_start_from else None
        round_start_to = datetime.strptime(round_start_to, "%d-%m-%Y") if round_start_to else None
        current_date = datetime(self.get_year(current_date), 1, 1) if current_date else datetime(self.get_year(), 1, 1)
        # get the filter query on start from and start to dates
        query_rounds = Q()
        if not round_start_from and not round_start_to:
            query_rounds = Q(started_at__gte=current_date)
        else:
            if round_start_from:
                query_rounds &= Q(started_at__gte=round_start_from)
            if round_start_to:
                query_rounds &= Q(started_at__lte=round_start_to)

        rounds = (
            Round.objects.select_related("campaign")
            .filter(query_rounds)
            .exclude(
                Q(campaign__isnull=True) | Q(campaign__is_test=True)
            )  # TODO see if on hold should be excluded as well
        )

        # get filtered rounds
        rounds = self.get_filtered_rounds(rounds, request.GET)
        # The csv file name base on the start from and start to dates
        start_from_name = (
            "--start-from-" + round_start_from.strftime("%d-%m-%Y")
            if round_start_from
            else ("--start-from-" + current_date.strftime("%d-%m-%Y") if not round_start_to else "")
        )
        start_to_name = "--start-to-" + round_start_to.strftime("%d-%m-%Y") if round_start_to else ""

        filename = "%s%s%s" % (
            "all-rounds-scopes",
            start_from_name,
            start_to_name,
        )
        # get csv columns
        columns = self.csv_columns()
        org_units_list = []
        # loop on filtered rounds and make the org_units_list to be pushed in the csv file
        for round in rounds:
            org_units_list += self.get_org_units_list(round, round.campaign)

        response = StreamingHttpResponse(
            streaming_content=(iter_items(org_units_list, Echo(), columns, self.get_row)), content_type=CONTENT_TYPE_CSV
        )
        filename = filename + ".csv"
        response["Content-Disposition"] = "attachment; filename=%s" % filename

        return response

    @action(methods=["GET"], detail=False, serializer_class=None)
    def csv_campaign_scopes_export(self, request, **kwargs):
        """
        It generates a csv export file with round's related informations

            parameters:
                self: a self
                round: an integer representing the round id
            returns:
                it generates a csv file export
        """
        round = Round.objects.get(pk=request.GET.get("round"))
        campaign = round.campaign
        org_units_list = self.get_org_units_list(round, campaign)

        filename = "%s-%s--%s--%s-%s" % (
            "campaign",
            campaign.obr_name,
            "R" + str(round.number),
            "org_units",
            strftime("%Y-%m-%d-%H-%M", gmtime()),
        )
        columns = self.csv_columns()

        response = StreamingHttpResponse(
            streaming_content=(iter_items(org_units_list, Echo(), columns, self.get_row)), content_type=CONTENT_TYPE_CSV
        )
        filename = filename + ".csv"
        response["Content-Disposition"] = "attachment; filename=%s" % filename

        return response

    @action(methods=["GET"], detail=False, serializer_class=None)
    def csv_campaigns_export(self, request, **kwargs):
        """
        It generates a csv export for all campaigns and their related rounds information

            parameters:
                self: a self
            returns:
                it generates a csv file export
        """
        columns = self.campaign_csv_columns()
        queryset = self.get_queryset()

        if not request.query_params.get("deletion_status"):
            queryset = queryset.filter(deleted_at__isnull=True)

        campaigns = self.filter_queryset(queryset)
        rounds = Round.objects.order_by("campaign__created_at").filter(campaign_id__in=campaigns)
        data = []

        for round in rounds:
            item = {}
            campaign = campaigns.get(pk=round.campaign_id)
            country = campaign.country.name if campaign.country else ""
            obr_name = campaign.obr_name
            vaccine_types = campaign.vaccines_extended
            onset_date = campaign.onset_at
            round_number = round.number
            item["country"] = country
            item["obr_name"] = obr_name
            item["vaccine_types"] = vaccine_types
            item["round_number"] = round_number
            item["onset_date"] = onset_date
            item["round_start_date"] = round.started_at
            item["round_end_date"] = round.ended_at
            item["ra_submission_date"] = campaign.risk_assessment_first_draft_submitted_at
            item["ra_approval_date"] = campaign.risk_assessment_rrt_oprtt_approval_at
            item["who_disbursed_to_co_at"] = campaign.who_disbursed_to_co_at
            item["who_disbursed_to_moh_at"] = campaign.who_disbursed_to_moh_at
            item["unicef_disbursed_to_co_at"] = campaign.unicef_disbursed_to_co_at
            item["unicef_disbursed_to_moh_at"] = campaign.unicef_disbursed_to_moh_at
            item["gpei_coordinator"] = campaign.gpei_coordinator
            item["round_target_population"] = (
                round.target_population if (round.target_population and (round.target_population > 0)) else ""
            )

            item["doses_requested"] = round.doses_requested
            if round.lqas_district_failing == 0 and round.lqas_district_passing == 0:
                item["lqas_district_passing"] = ""
                item["lqas_district_failing"] = ""
            else:
                item["lqas_district_passing"] = round.lqas_district_passing
                item["lqas_district_failing"] = round.lqas_district_failing
            item["budget_approved_date"] = campaign.approved_at_WFEDITABLE
            item["budget_submitted_date"] = campaign.submitted_to_rrt_at_WFEDITABLE
            item["preparedness_sync_status"] = (
                round.preparedness_sync_status if round.preparedness_spreadsheet_url else ""
            )

            item["pv_notified_at"] = campaign.cvdpv2_notified_at
            item["preparedness_spreadsheet_url"] = round.preparedness_spreadsheet_url
            item["cost"] = int(float(round.cost)) if (round.cost and (float(round.cost) > 0)) else ""
            data.append(item)

        filename = "%s-%s--%s" % (
            "campaigns",
            "rounds",
            strftime("%Y-%m-%d-%H-%M", gmtime()),
        )

        response = StreamingHttpResponse(
            streaming_content=(iter_items(data, Echo(), columns, self.get_campain_row)),
            content_type=CONTENT_TYPE_CSV,
        )
        filename = filename + ".csv"
        response["Content-Disposition"] = "attachment; filename=%s" % filename

        return response

    @staticmethod
    def get_year(current_date=None):
        if current_date is not None:
            current_date = datetime.strptime(current_date, "%Y-%m-%d")
            current_date = current_date.date()
            return current_date.year
        today = datetime.today()
        return today.year

    @staticmethod
    def csv_columns():
        """
        It returns the csv file columns for round scopes
        """
        return [
            {"title": "ID", "width": 10},
            {"title": "Admin 2", "width": 25},
            {"title": "Admin 1", "width": 25},
            {"title": "Admin 0", "width": 25},
            {"title": "OBR Name", "width": 25},
            {"title": "Round Number", "width": 35},
            {"title": "Start date", "width": 35},
            {"title": "Vaccine", "width": 35},
        ]

    @staticmethod
    def campaign_csv_columns():
        """
        It returns the csv file columns for campaigns
        """

        return [
            {"title": "country", "width": 10},
            {"title": "obr_name", "width": 25},
            {"title": "vaccine_types", "width": 25},
            {"title": "onset_date", "width": 25},
            {"title": "pv_notified_at", "width": 25},
            {"title": "round_number", "width": 35},
            {"title": "round_start_date", "width": 35},
            {"title": "round_end_date", "width": 35},
            {"title": "ra_submission_date", "width": 35},
            {"title": "ra_approval_date", "width": 35},
            {"title": "budget_submitted_date", "width": 35},
            {"title": "budget_approved_date", "width": 35},
            {"title": "who_disbursed_to_co_at", "width": 35},
            {"title": "who_disbursed_to_moh_at", "width": 35},
            {"title": "unicef_disbursed_to_co_at", "width": 35},
            {"title": "unicef_disbursed_to_moh_at", "width": 35},
            {"title": "gpei_coordinator", "width": 35},
            {"title": "round_target_population", "width": 35},
            {"title": "doses_requested", "width": 35},
            {"title": "cost", "width": 35},
            {"title": "lqas_district_passing", "width": 35},
            {"title": "lqas_district_failing", "width": 35},
            {"title": "preparedness_spreadsheet_url", "width": 35},
            {"title": "preparedness_sync_status", "width": 35},
        ]

    @staticmethod
    def get_row(org_unit, **kwargs):
        """
        It get data to be display on a csv row from the org units list
            parameters:
                org_unit: an org unit
                kwargs: arguments dictionary
            return:
                returns a row of a csv file
        """
        campaign_scope_values = [
            org_unit.get("id"),
            org_unit.get("org_unit_name"),
            org_unit.get("org_unit_parent_name"),
            org_unit.get("org_unit_parent_of_parent_name"),
            org_unit.get("obr_name"),
            org_unit.get("round_number"),
            org_unit.get("start_date"),
            org_unit.get("vaccine"),
        ]

        return campaign_scope_values

    @staticmethod
    def get_campain_row(data, **kwargs):
        colums = CampaignViewSet.campaign_csv_columns()
        campaigns_data = []
        for column in colums:
            campaigns_data.append(data.get(column["title"]))
        return campaigns_data

    @staticmethod
    def get_filtered_rounds(rounds, params, exclude_test_rounds=False):
        """
        It returns the filtered rounds based on params from url
            parameters:
                rounds: list of rounds
                params: params from url
                exclude_test_rounds: whether to exclude test rounds or not
            return:
                returns filtered list of rounds
        """
        countries = params.get("countries") if params.get("countries") is not None else None
        campaign_groups = params.get("campaignGroups") if params.get("campaignGroups") is not None else None
        campaign_category = params.get("campaignCategory") if params.get("campaignCategory") is not None else None
        search = params.get("search")
        org_unit_groups = params.get("orgUnitGroups") if params.get("orgUnitGroups") is not None else None

        # Filter out rounds on hold if requested
        if exclude_test_rounds:
            rounds = rounds.filter(on_hold=False)

        # Test campaigns should not appear in the xlsx calendar
        rounds = rounds.filter(campaign__is_test=False)
        if countries:
            rounds = rounds.filter(campaign__country_id__in=countries.split(","))
        if campaign_groups:
            rounds = rounds.filter(campaign__group_id__in=campaign_groups.split(","))
        if campaign_category == "on_hold":
            rounds = rounds.filter(campaign__on_hold=True)
        if campaign_category == "preventive":
            rounds = rounds.filter(campaign__is_preventive=True)
        if campaign_category == "regular":
            rounds = (
                rounds.filter(campaign__is_preventive=False)
                .filter(campaign__is_test=False)
                .filter(campaign__on_hold=False)
            )
        if search:
            rounds = rounds.filter(Q(campaign__obr_name__icontains=search) | Q(campaign__epid__icontains=search))
        if org_unit_groups:
            rounds = rounds.filter(campaign__country__groups__in=org_unit_groups.split(","))
        return rounds

    @staticmethod
    def get_org_units_list(round, campaign):
        """
        It returns org units list as a list of items
            parameters:
                round: a round
                campaign: a campaign
            return:
                returns org units list as a list of items
        """
        org_units_list = []
        if not campaign.separate_scopes_per_round:
            scopes = campaign.scopes.prefetch_related("group__org_units__org_unit_type").prefetch_related(
                "group__org_units__parent__parent"
            )
        else:
            scopes = round.scopes.prefetch_related("group__org_units__org_unit_type").prefetch_related(
                "group__org_units__parent__parent"
            )

        for scope in scopes.all():
            for org_unit in scope.group.org_units.all():
                item = {}
                item["id"] = org_unit.id
                item["org_unit_name"] = org_unit.name

                if org_unit.parent:
                    item["org_unit_parent_name"] = org_unit.parent.name
                else:
                    item["org_unit_parent_name"] = ""

                if org_unit.parent and org_unit.parent.parent:
                    item["org_unit_parent_of_parent_name"] = org_unit.parent.parent.name
                else:
                    item["org_unit_parent_of_parent_name"] = ""

                item["obr_name"] = campaign.obr_name
                item["round_number"] = "R" + str(round.number)
                item["start_date"] = round.started_at
                item["vaccine"] = scope.vaccine
                org_units_list.append(item)
        return org_units_list

    def get_calendar_data(self: "CampaignViewSet", year: int, params: Any) -> Any:
        """
        Returns filtered rounds from database
        """
        rounds = Round.objects.filter(started_at__year=year)
        rounds = self.get_filtered_rounds(rounds, params, exclude_test_rounds=True)

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
        started_at = datetime.strftime(round.started_at, "%Y-%m-%d") if round.started_at is not None else None
        ended_at = datetime.strftime(round.ended_at, "%Y-%m-%d") if round.ended_at is not None else None
        obr_name = campaign.obr_name if campaign.obr_name is not None else ""
        round_number = round.number if round.number is not None else ""
        # count all districts in the country
        country_districts_count = country.descendants().filter(org_unit_type__category="DISTRICT").count()
        # count disticts related to the round
        round_districts_count = len(campaign.get_districts_for_round_number(round_number)) if round_number else 0
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
            "vaccines": round.vaccine_names,
            "round_number": round_number,
            "percentage_covered_target_population": percentage_covered_target_population,
            "target_population": target_population,
            "nid_or_snid": nid_or_snid,
        }

    @action(methods=["POST"], detail=True, serializer_class=CampaignPreparednessSpreadsheetSerializer)
    def create_preparedness_sheet(self, request: Request, pk=None, **kwargs):
        data = request.data
        data["campaign"] = pk
        serializer = CampaignPreparednessSpreadsheetSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
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
            raise serializers.ValidationError("No recipients have been configured on the country")

        send_mail(
            f"New Campaign {campaign.obr_name}",
            email_text,
            from_email,
            emails,
        )
        campaign.creation_email_send_at = now()
        campaign.save()
        request_user = self.request.user
        log_campaign_modification(campaign, old_campaign_dump, request_user)

        return Response({"message": "email sent"})

    # We need to authorize PATCH request to enable restore_deleted_campaign endpoint
    # But Patching the campaign directly is very much error prone, so we disable it indirectly
    # Updates are done in the CampaignSerializer
    def partial_update(self):
        """Don't PATCH this way, it won't do anything
        We need to authorize PATCH request to enable restore_deleted_campaign endpoint
        But Patching the campign directly is very much error prone, so we disable it indirectly
        # Updates are done in the CampaignSerializer
        """

    @action(methods=["PATCH"], detail=False)
    def restore_deleted_campaigns(self, request):
        campaign = get_object_or_404(Campaign, pk=request.data["id"])
        if campaign.deleted_at is not None:
            campaign.deleted_at = None
            campaign.save()
            return Response(campaign.id, status=status.HTTP_200_OK)
        return Response("Campaign already active.", status=status.HTTP_400_BAD_REQUEST)

    @action(
        methods=["GET", "HEAD"],  # type: ignore # HEAD is missing in djangorestframework-stubs
        detail=False,
        url_path="v3/merged_shapes.geojson",
    )
    def shapes_v3(self, request):
        """
        Merged shapes for the campaign. Used for the calendar
        """
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
