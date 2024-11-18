from datetime import datetime

from django.db.models import Q, Min, Max
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, serializers
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


class VaccineReportingSerializer(serializers.Serializer):
    country_name = serializers.CharField(source="country.name")
    campaign_obr_name = serializers.CharField(source="obr_name")
    rounds_count = serializers.SerializerMethodField()
    start_date = serializers.SerializerMethodField()

    vrf_data = serializers.SerializerMethodField()
    pre_alert_data = serializers.SerializerMethodField()
    form_a_data = serializers.SerializerMethodField()

    def get_start_date(self, obj):
        return obj.started_at

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


class VaccineReportingViewSet(GenericViewSet, ListModelMixin):
    """
    ViewSet for retrieving vaccine reporting data.

    This ViewSet provides actions to retrieve reporting information for vaccine campaigns,
    including VRFs, pre-alerts, Form As, incident reports and destruction reports.

    Available endpoints:

    GET /api/polio/vaccine/reporting/
    Return a paginated list of campaigns with their associated reporting documents.
    The list can be filtered by:
    - File type (VRF, PRE_ALERT, FORM_A, INCIDENT, DESTRUCTION)
    - Campaign status (ONGOING, PAST, PREPARING)
    - Country block
    - Country
    - Campaign ID

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

    serializer_class = VaccineReportingSerializer
    pagination_class = Paginator
    filter_backends = [OrderingFilter, SearchFilter]
    ordering_fields = ["country__name", "obr_name", "started_at"]
    search_fields = ["country__name", "obr_name"]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    file_type_param = openapi.Parameter(
        "file_type",
        openapi.IN_QUERY,
        description="Filter by file type (VRF, PRE_ALERT, FORM_A, INCIDENT, DESTRUCTION)",
        type=openapi.TYPE_STRING,
    )

    campaign_status_param = openapi.Parameter(
        "campaign_status",
        openapi.IN_QUERY,
        description="Filter by campaign status (ONGOING, PAST)",
        type=openapi.TYPE_STRING,
    )

    # @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    @swagger_auto_schema(manual_parameters=[file_type_param, campaign_status_param])
    def list(self, request, *args, **kwargs):
        """
        Return a paginated list of campaigns with their reporting documents.

        The list can be filtered by file type, campaign status, country block,
        country and campaign ID. Results are paginated with a default page size of 10.
        """
        if request.query_params.get("limit", None) is None:
            self.pagination_class.page_size = 10

        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        """
        Get the queryset for Campaign objects.

        The queryset:
        - Includes only campaigns that have VRFs
        - Can be filtered by campaign status (ONGOING, PAST, PREPARING)
        - Can be filtered by country block (give ids of org unit groups)
        - Can be filtered by country (give country id)
        - Can be filtered by campaign ID (give campaign OBR name)
        - Can be filtered by document type (VRF, PRE_ALERT, FORM_A, INCIDENT, DESTRUCTION)

        Returns annotated queryset with campaign start dates.
        """
        queryset = Campaign.objects.filter(vaccinerequestform__isnull=False).annotate(
            started_at=Min("rounds__started_at"),
            ended_at=Max("rounds__ended_at"),
        )

        # Filter by campaign status
        campaign_status = self.request.query_params.get("campaign_status", None)
        if campaign_status:
            today = datetime.now().date()
            if campaign_status.upper() == "ONGOING":
                queryset = queryset.filter(ended_at__gte=today)
            elif campaign_status.upper() == "PAST":
                queryset = queryset.filter(ended_at__lt=today)
            elif campaign_status.upper() == "PREPARING":
                queryset = queryset.filter(started_at__gte=today)

        # Filter by country block
        country_block = self.request.query_params.get("country_block", None)
        if country_block:
            queryset = queryset.filter(country__groups__in=country_block.split(","))

        # Filter by country
        country = self.request.query_params.get("country", None)
        if country:
            queryset = queryset.filter(country=country)

        # Filter by campaign
        campaign = self.request.query_params.get("campaign", None)
        if campaign:
            queryset = queryset.filter(obr_name=campaign)

        # Filter by file type
        file_type = self.request.query_params.get("file_type", None)
        if file_type:
            file_type = file_type.upper()
            if file_type == "VRF":
                queryset = queryset.filter(vaccine_request_forms__isnull=False)
            elif file_type == "PRE_ALERT":
                queryset = queryset.filter(vaccine_pre_alerts__isnull=False)
            elif file_type == "FORM_A":
                queryset = queryset.filter(outgoing_stock_movements__isnull=False)

        return queryset
