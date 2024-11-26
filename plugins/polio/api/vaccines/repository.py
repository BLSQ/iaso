"""API endpoints and serializers for vaccine repository management."""

from datetime import datetime, timedelta
from django.db.models import Max, Min, OuterRef, Subquery
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, permissions, serializers
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.mixins import ListModelMixin
from rest_framework.viewsets import GenericViewSet
from django.db.models import OuterRef, Subquery, Q, Value

from iaso.api.common import Paginator
from plugins.polio.models import (
    VACCINES,
    CampaignType,
    OutgoingStockMovement,
    Round,
    VaccinePreAlert,
    VaccineRequestForm,
    VaccineRequestFormType,
)


class VaccineRepositorySerializer(serializers.Serializer):
    country_name = serializers.CharField(source="campaign.country.name")
    campaign_obr_name = serializers.CharField(source="campaign.obr_name")
    round_id = serializers.IntegerField(source="id")
    number = serializers.IntegerField()
    start_date = serializers.DateField(source="started_at")
    end_date = serializers.DateField(source="ended_at")
    vaccine_name = serializers.CharField()

    vrf_data = serializers.SerializerMethodField()
    pre_alert_data = serializers.SerializerMethodField()
    form_a_data = serializers.SerializerMethodField()

    def get_vrf_data(self, obj):
        vrfs = VaccineRequestForm.objects.filter(campaign=obj.campaign, rounds=obj, vaccine_type=obj.vaccine_name)
        return [
            {
                "date": vrf.date_vrf_reception,
                "file": vrf.document.url if vrf.document else None,
                "is_missing": vrf.vrf_type == VaccineRequestFormType.MISSING,
                "is_not_required": vrf.vrf_type == VaccineRequestFormType.NOT_REQUIRED,
                "id": vrf.id,
            }
            for vrf in vrfs
        ]

    def get_pre_alert_data(self, obj):
        pre_alerts = VaccinePreAlert.objects.filter(
            request_form__campaign=obj.campaign, request_form__rounds=obj, request_form__vaccine_type=obj.vaccine_name
        )
        return [
            {
                "date": pa.date_pre_alert_reception,
                "file": pa.document.url if pa.document else None,
                "vrf_id": pa.request_form.id,
            }
            for pa in pre_alerts
        ]

    def get_form_a_data(self, obj):
        form_as = OutgoingStockMovement.objects.filter(
            campaign=obj.campaign, round=obj, vaccine_stock__vaccine=obj.vaccine_name
        )
        return [
            {
                "date": fa.form_a_reception_date,
                "file": fa.document.url if fa.document else None,
                "is_late": fa.form_a_reception_date > (obj.ended_at + timedelta(days=14))
                if fa.form_a_reception_date and obj.ended_at
                else None,
            }
            for fa in form_as
        ]


class VaccineRepositoryViewSet(GenericViewSet, ListModelMixin):
    """
    ViewSet for retrieving vaccine repository data.
    """

    serializer_class = VaccineRepositorySerializer
    pagination_class = Paginator
    filter_backends = [OrderingFilter, SearchFilter]
    ordering_fields = ["campaign__country__name", "campaign__obr_name", "started_at", "vaccine_name", "number"]
    ordering = ["-started_at"]
    search_fields = ["campaign__country__name", "campaign__obr_name"]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    default_page_size = 20

    file_type_param = openapi.Parameter(
        "file_type",
        openapi.IN_QUERY,
        description="Filter by file type (VRF, PRE_ALERT, FORM_A)",
        type=openapi.TYPE_STRING,
    )

    campaign_status_param = openapi.Parameter(
        "campaign_status",
        openapi.IN_QUERY,
        description="Filter by campaign status (ONGOING, PAST, PREPARING)",
        type=openapi.TYPE_STRING,
    )

    vrf_type_param = openapi.Parameter(
        "vrf_type",
        openapi.IN_QUERY,
        description="Filter by VRF type (Normal, Missing, Not Required)",
        type=openapi.TYPE_STRING,
    )

    campaign_id_param = openapi.Parameter(
        "campaign",
        openapi.IN_QUERY,
        description="Filter by campaign ID (OBR name)",
        type=openapi.TYPE_STRING,
    )

    country_block_param = openapi.Parameter(
        "country_block",
        openapi.IN_QUERY,
        description="Filter by country block (comma separated list of org unit group ids)",
        type=openapi.TYPE_STRING,
    )

    country_param = openapi.Parameter(
        "country",
        openapi.IN_QUERY,
        description="Filter by country (id of country)",
        type=openapi.TYPE_STRING,
    )

    # @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    @swagger_auto_schema(
        manual_parameters=[
            file_type_param,
            campaign_status_param,
            vrf_type_param,
            campaign_id_param,
            country_block_param,
            country_param,
        ]
    )
    def list(self, request, *args, **kwargs):
        """
        Vaccine PDF Repository

        **GET /api/polio/vaccine/repository/**
        Return a paginated list of campaigns with their associated reporting documents.
        By default it returns 20 campaigns per page ordered by start date descending. (Campaigns must have at least one round with a start date and end date)

        The list can be filtered by:
        - File type (file_type) (possible values : VRF, PRE_ALERT, FORM_A)
        - Campaign status (campaign_status) (possible values : ONGOING, PAST, PREPARING)
        - Country block (country_block) comma separated list of org unit group ids
        - Country (countries) comma-separated list of country IDs
        - Campaign ID (campaign) OBR name of campaign
        - VRF type (vrf_type) (possible values : Normal, Missing, Not Required)

        The results can be ordered by:
        - Country name ("campaign__country__name")
        - OBR name ("campaign__obr_name")
        - Start date ("started_at")

        The response includes for each campaign:
        - Basic campaign info (country, OBR name, dates)
        - VRF data (date, file, is_missing, is_not_required)
        - Pre-alert data (date, file)
        - Form A data (date, file)
        """
        if request.query_params.get("limit", None) is None:
            self.pagination_class.page_size = self.default_page_size

        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        """
        Get the queryset for Round objects with their campaigns.
        The filtering has been moved here, because we return a union of querysets to duplicate the rounds that have several vaccines
        and django will complain if we try to call filter() after union()
        """
        request = self.request
        rounds_queryset = (
            Round.objects.filter(
                campaign__isnull=False,
                campaign__deleted_at__isnull=True,
                campaign__campaign_types__name=CampaignType.POLIO,
            )
            .select_related(
                "campaign",
                "campaign__country",
            )
            .prefetch_related("scopes", "campaign__scopes")
        )

        # Get campaign dates subquery here i.o filter to avoid error from calling annotate after union
        campaign_dates = (
            Round.objects.filter(campaign=OuterRef("campaign"))
            .values("campaign")
            .annotate(campaign_started_at=Min("started_at"), campaign_ended_at=Max("ended_at"))
        )

        # Add campaign dates to main queryset
        rounds_queryset = rounds_queryset.annotate(
            campaign_started_at=Subquery(campaign_dates.values("campaign_started_at")),
            campaign_ended_at=Subquery(campaign_dates.values("campaign_ended_at")),
        )

        # Filter by country block
        country_block = request.query_params.get("country_block", None)
        if country_block:
            try:
                country_block_ids = [int(id) for id in country_block.split(",")]
                rounds_queryset = rounds_queryset.filter(campaign__country__groups__in=country_block_ids)
            except ValueError:
                raise ValidationError("country_block must be a comma-separated list of integers")

        # Filter by country (multi)
        countries = request.query_params.get("countries", None)
        if countries:
            try:
                country_ids = [int(id) for id in countries.split(",")]
                rounds_queryset = rounds_queryset.filter(campaign__country__id__in=country_ids)
            except ValueError:
                raise ValidationError("countries must be a comma-separated list of integers")

        # Filter by campaign
        campaign = request.query_params.get("campaign", None)
        if campaign:
            rounds_queryset = rounds_queryset.filter(campaign__obr_name=campaign)

        # TODO move this logic in the for loop to associate the right forms with the right round
        # Filter by file type
        file_type = request.query_params.get("file_type", None)
        # if file_type:
        #     file_type = file_type.upper()
        #     if file_type == "VRF":
        #         rounds_queryset = rounds_queryset.filter(campaign__vaccinerequestform__isnull=False)
        #     elif file_type == "PRE_ALERT":
        #         rounds_queryset = rounds_queryset.filter(
        #             campaign__vaccinerequestform__isnull=False,
        #             campaign__vaccinerequestform__vaccineprealert__isnull=False,
        #         ).distinct("id")
        #     elif file_type == "FORM_A":
        #         rounds_queryset = rounds_queryset.filter(outgoingstockmovement__isnull=False)

        # Filter by VRF type
        vrf_type = request.query_params.get("vrf_type", None)
        if vrf_type:
            rounds_queryset = rounds_queryset.filter(
                campaign__vaccinerequestform__isnull=False, campaign__vaccinerequestform__vrf_type=vrf_type
            )

        # Filter by vaccine
        vaccine_type = request.query_params.get("vaccine_type", None)
        if vaccine_type:
            if file_type:
                file_type = file_type.upper()
                if file_type == "VRF":
                    rounds_queryset = rounds_queryset.filter(
                        campaign__vaccinerequestform__isnull=False,
                        campaign__vaccinerequestform__vaccine_type=vaccine_type,
                    ).distinct()
                elif file_type == "PRE_ALERT":
                    rounds_queryset = rounds_queryset.filter(
                        campaign__vaccinerequestform__isnull=False,
                        campaign__vaccinerequestform__vaccineprealert__isnull=False,
                        campaign__vaccinerequestform__vaccine_type=vaccine_type,
                    ).distinct()
                elif file_type == "FORM_A":
                    rounds_queryset = rounds_queryset.filter(
                        outgoingstockmovement__isnull=False, outgoingstockmovement__vaccine_stock__vaccine=vaccine_type
                    ).distinct()
            return rounds_queryset.filter_by_vaccine_name(vaccine_type).annotate(vaccine_name=Value(vaccine_type))
        else:
            vaccines_qs = {}
            for vaccine in VACCINES:
                vaccine_name = vaccine[0]
                qs_filtered_for_files = rounds_queryset
                if file_type:
                    file_type = file_type.upper()
                    if file_type == "VRF":
                        qs_filtered_for_files = qs_filtered_for_files.filter(
                            campaign__vaccinerequestform__isnull=False,
                            campaign__vaccinerequestform__vaccine_type=vaccine_name,
                        ).distinct()
                    elif file_type == "PRE_ALERT":
                        qs_filtered_for_files = qs_filtered_for_files.filter(
                            campaign__vaccinerequestform__isnull=False,
                            campaign__vaccinerequestform__vaccineprealert__isnull=False,
                            campaign__vaccinerequestform__vaccine_type=vaccine_name,
                        ).distinct()
                    elif file_type == "FORM_A":
                        qs_filtered_for_files = qs_filtered_for_files.filter(
                            outgoingstockmovement__isnull=False,
                            outgoingstockmovement__vaccine_stock__vaccine=vaccine_name,
                        ).distinct()
                vaccines_qs[vaccine_name] = qs_filtered_for_files.filter_by_vaccine_name(vaccine_name).annotate(
                    vaccine_name=Value(vaccine_name)
                )
            queryset_list = list(vaccines_qs.values())
            start_qs = queryset_list.pop()
            result_qs = start_qs.union(*queryset_list, all=True)

            return result_qs
