from datetime import datetime

from django.db.models import Q, Min, Max
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, serializers, filters
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.mixins import ListModelMixin
from rest_framework.viewsets import GenericViewSet

from iaso.api.common import Paginator
from plugins.polio.models import (
    Campaign,
    DestructionReport,
    IncidentReport,
    OutgoingStockMovement,
    Round,
    VaccinePreAlert,
    VaccineRequestForm,
)


# 1 round par ligne
# on vire destruction et incident
# Toutes les campagnes (Order by start date descending limit 10)
# Filtres doivent fonctionner
# Sort 4 premieres colonnes
# "Not required" to be implemented if type is not required, "Missing"
# Filtre by type of VRF (Missing, Not Required, Normal)


class VaccineRepositorySerializer(serializers.Serializer):
    country_name = serializers.CharField(source="country.name")
    campaign_obr_name = serializers.CharField(source="obr_name")
    rounds_count = serializers.SerializerMethodField()
    start_date = serializers.DateField(source="started_at")
    end_date = serializers.DateField(source="ended_at")

    vrf_data = serializers.SerializerMethodField()
    pre_alert_data = serializers.SerializerMethodField()
    form_a_data = serializers.SerializerMethodField()

    def get_rounds_count(self, obj):
        return Round.objects.filter(campaign=obj).count()

    def get_vrf_data(self, obj):
        vrfs = VaccineRequestForm.objects.filter(campaign=obj)
        return [{"date": vrf.date_vrf_reception, "file": vrf.document.url if vrf.document else None} for vrf in vrfs]

    def get_pre_alert_data(self, obj):
        pre_alerts = VaccinePreAlert.objects.filter(request_form__campaign=obj)
        return [
            {"date": pa.date_pre_alert_reception, "file": pa.document.url if pa.document else None} for pa in pre_alerts
        ]

    def get_form_a_data(self, obj):
        form_as = OutgoingStockMovement.objects.filter(campaign=obj)
        return [{"date": fa.report_date, "file": fa.document.url if fa.document else None} for fa in form_as]


class VaccineReportingFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        # Filter by campaign status
        campaign_status = request.query_params.get("campaign_status", None)
        if campaign_status:
            today = datetime.now().date()
            if campaign_status.upper() == "ONGOING":
                queryset = queryset.filter(started_at__lte=today, ended_at__gte=today)
            elif campaign_status.upper() == "PAST":
                queryset = queryset.filter(started_at__lt=today, ended_at__lt=today)
            elif campaign_status.upper() == "PREPARING":
                queryset = queryset.filter(started_at__gte=today)

        # Filter by country block
        country_block = request.query_params.get("country_block", None)
        if country_block:
            queryset = queryset.filter(country__groups__in=country_block.split(","))

        # Filter by country
        country = request.query_params.get("country", None)
        if country:
            queryset = queryset.filter(country__id=country)

        # Filter by campaign
        campaign = request.query_params.get("campaign", None)
        if campaign:
            queryset = queryset.filter(obr_name=campaign)

        # Filter by file type
        file_type = request.query_params.get("file_type", None)
        if file_type:
            file_type = file_type.upper()
            if file_type == "VRF":
                queryset = queryset.filter(
                    vaccinerequestform__isnull=False, vaccinerequestform__document__isnull=False
                ).exclude(vaccinerequestform__document="")
            elif file_type == "PRE_ALERT":
                queryset = queryset.filter(
                    vaccinerequestform__isnull=False,
                    vaccinerequestform__vaccineprealert__isnull=False,
                    vaccinerequestform__vaccineprealert__document__isnull=False,
                ).exclude(vaccinerequestform__vaccineprealert__document="")
            elif file_type == "FORM_A":
                queryset = queryset.filter(
                    outgoingstockmovement__isnull=False, outgoingstockmovement__document__isnull=False
                ).exclude(outgoingstockmovement__document="")

        # Filter by VRF type
        vrf_type = request.query_params.get("vrf_type", None)
        if vrf_type:
            queryset = queryset.filter(vaccinerequestform__isnull=False, vaccinerequestform__vrf_type=vrf_type)

        return queryset


class VaccineRepositoryViewSet(GenericViewSet, ListModelMixin):
    """
    ViewSet for retrieving vaccine repository data.
    """

    serializer_class = VaccineRepositorySerializer
    pagination_class = Paginator
    filter_backends = [OrderingFilter, SearchFilter, VaccineReportingFilterBackend]
    ordering_fields = ["country__name", "obr_name", "started_at"]
    ordering = ["-started_at"]
    search_fields = ["country__name", "obr_name"]
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
        - Country (country) id of country
        - Campaign ID (campaign) OBR name of campaign
        - VRF type (vrf_type) (possible values : Normal, Missing, Not Required)

        The results can be ordered by:
        - Country name ("country__name")
        - OBR name ("obr_name")
        - Start date ("started_at")

        The response includes for each campaign:
        - Basic campaign info (country, OBR name, dates)
        - VRF data
        - Pre-alert data
        - Form A data
        - Incident reports
        - Destruction reports
        """
        if request.query_params.get("limit", None) is None:
            self.pagination_class.page_size = self.default_page_size

        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        """
        Get the queryset for Campaign objects.

        Returns annotated queryset with campaign start dates.
        """
        return (
            Campaign.objects.filter(rounds__isnull=False)
            .annotate(
                started_at=Min("rounds__started_at"),
                ended_at=Max("rounds__ended_at"),
            )
            .exclude(Q(started_at__isnull=True) | Q(ended_at__isnull=True))
        )
