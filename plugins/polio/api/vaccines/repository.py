from datetime import datetime

from django.db.models import Q, Min
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

# "Not required" to be implemented if type is not required
# Wait for return concerning which date to display


class VaccineReportingSerializer(serializers.Serializer):
    country_name = serializers.CharField(source="country.name")
    campaign_obr_name = serializers.CharField(source="obr_name")
    rounds_count = serializers.SerializerMethodField()
    start_date = serializers.SerializerMethodField()

    vrf_data = serializers.SerializerMethodField()
    pre_alert_data = serializers.SerializerMethodField()
    form_a_data = serializers.SerializerMethodField()
    incident_reports = serializers.SerializerMethodField()
    destruction_reports = serializers.SerializerMethodField()

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

    def get_incident_reports(self, obj):
        last_round = Round.objects.filter(campaign=obj).order_by("-ended_at").first()
        if last_round and last_round.ended_at:
            incidents = IncidentReport.objects.filter(
                vaccine_stock__country=obj.country, date_of_incident_report__gte=last_round.ended_at
            )
            return [
                {"date": ir.date_of_incident_report, "file": ir.document.url if ir.document else None}
                for ir in incidents
            ]
        return []

    def get_destruction_reports(self, obj):
        last_round = Round.objects.filter(campaign=obj).order_by("-ended_at").first()
        if last_round and last_round.ended_at:
            destructions = DestructionReport.objects.filter(
                vaccine_stock__country=obj.country, destruction_report_date__gte=last_round.ended_at
            )
            return [
                {"date": dr.destruction_report_date, "file": dr.document.url if dr.document else None}
                for dr in destructions
            ]
        return []


class VaccineReportingViewSet(GenericViewSet, ListModelMixin):
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
        if request.query_params.get("limit", None) is None:
            self.pagination_class.page_size = 10

        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        queryset = Campaign.objects.filter(vaccinerequestform__isnull=False).annotate(
            started_at=Min("rounds__started_at")
        )

        # Filter by campaign status
        campaign_status = self.request.query_params.get("campaign_status", None)
        if campaign_status:
            today = datetime.now().date()
            if campaign_status.upper() == "ONGOING":
                queryset = queryset.filter(end_date__gte=today)
            elif campaign_status.upper() == "PAST":
                queryset = queryset.filter(end_date__lt=today)

        # Filter by country block
        country_block = self.request.query_params.get("country_block", None)
        if country_block:
            queryset = queryset.filter(country__country_block=country_block)

        # Filter by country
        country = self.request.query_params.get("country", None)
        if country:
            queryset = queryset.filter(country=country)

        # Filter by campaign
        campaign = self.request.query_params.get("campaign", None)
        if campaign:
            queryset = queryset.filter(id=campaign)

        # Filter by file type
        file_type = self.request.query_params.get("file_type", None)
        if file_type:
            file_type = file_type.upper()
            if file_type == "VRF":
                queryset = queryset.filter(vaccine_request_forms__isnull=False).distinct("id")
            elif file_type == "PRE_ALERT":
                queryset = queryset.filter(vaccine_request_forms__is_pre_alert=True).distinct("id")
            elif file_type == "FORM_A":
                queryset = queryset.filter(outgoing_stock_movements__isnull=False).distinct("id")
            elif file_type == "INCIDENT":
                queryset = queryset.filter(country__vaccine_stocks__incident_reports__isnull=False).distinct("id")
            elif file_type == "DESTRUCTION":
                queryset = queryset.filter(country__vaccine_stocks__destruction_reports__isnull=False).distinct("id")

        return queryset
