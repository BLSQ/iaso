from datetime import date
from enum import Enum
from tempfile import NamedTemporaryFile
from typing import Optional

from django.db.models import Q
from django.http import HttpResponse
from django.utils.dateparse import parse_date
from django_filters.rest_framework import FilterSet, NumberFilter
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import SearchFilter
from rest_framework.response import Response

from iaso.api.common import CONTENT_TYPE_XLSX, ModelViewSet, Paginator
from iaso.models import OrgUnit
from iaso.models.json_config import Config
from iaso.utils.virus_scan.serializers import ModelWithFileSerializer
from plugins.polio.api.vaccines.common import sort_results
from plugins.polio.api.vaccines.export_utils import download_xlsx_stock_variants
from plugins.polio.api.vaccines.permissions import (
    VaccineStockEarmarkPermission,
    VaccineStockPermission,
    can_edit_helper,
)
from plugins.polio.models import (
    Campaign,
    DestructionReport,
    EarmarkedStock,
    IncidentReport,
    OutgoingStockMovement,
    VaccineStock,
)
from plugins.polio.models.base import DOSES_PER_VIAL_CONFIG_SLUG, Round, VaccineStockCalculator
from plugins.polio.permissions import (
    POLIO_VACCINE_STOCK_EARMARKS_ADMIN_PERMISSION,
    POLIO_VACCINE_STOCK_EARMARKS_NONADMIN_PERMISSION,
    POLIO_VACCINE_STOCK_EARMARKS_READ_ONLY_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
)


class CampaignCategory(str, Enum):
    TEST_CAMPAIGN = "TEST_CAMPAIGN"
    CAMPAIGN_ON_HOLD = "CAMPAIGN_ON_HOLD"
    ALL_ROUNDS_ON_HOLD = "ALL_ROUNDS_ON_HOLD"
    ROUND_ON_HOLD = "ROUND_ON_HOLD"
    REGULAR = "REGULAR"


vaccine_stock_id_param = openapi.Parameter(
    name="vaccine_stock",
    in_=openapi.IN_QUERY,
    description="The Vaccine Stock id related to the current object",
    type=openapi.TYPE_INTEGER,
    required=False,
)


class VaccineStockListSerializer(serializers.ListSerializer):
    @staticmethod
    def calculate_for_instance(instance):
        instance.calculator = VaccineStockCalculator(instance)

    def to_representation(self, data):
        """
        List of object instances -> List of dicts of primitive datatypes.
        """
        # Calculate once for each instance
        for instance in data:
            self.calculate_for_instance(instance)
        return [VaccineStockSerializer(instance).data for instance in data]


class VaccineStockSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source="country.name")
    country_id = serializers.IntegerField(source="country.id")
    vaccine_type = serializers.CharField(source="vaccine")
    vials_received = serializers.SerializerMethodField()
    vials_used = serializers.SerializerMethodField()
    stock_of_usable_vials = serializers.SerializerMethodField()
    stock_of_unusable_vials = serializers.SerializerMethodField()
    vials_destroyed = serializers.SerializerMethodField()
    stock_of_earmarked_vials = serializers.SerializerMethodField()
    doses_received = serializers.SerializerMethodField()
    doses_used = serializers.SerializerMethodField()
    stock_of_usable_doses = serializers.SerializerMethodField()
    stock_of_unusable_doses = serializers.SerializerMethodField()
    doses_destroyed = serializers.SerializerMethodField()
    stock_of_earmarked_doses = serializers.SerializerMethodField()

    class Meta:
        model = VaccineStock
        fields = [
            "id",
            "country_name",
            "country_id",
            "vaccine_type",
            "vials_received",
            "vials_used",
            "stock_of_usable_vials",
            "stock_of_unusable_vials",
            "stock_of_earmarked_vials",
            "vials_destroyed",
            "doses_received",
            "doses_used",
            "stock_of_usable_doses",
            "stock_of_unusable_doses",
            "stock_of_earmarked_doses",
            "doses_destroyed",
        ]
        list_serializer_class = VaccineStockListSerializer

    def get_vials_received(self, obj):
        return obj.calculator.get_vials_received()[0]

    def get_vials_used(self, obj):
        return obj.calculator.get_vials_used()[0]

    def get_stock_of_usable_vials(self, obj):
        return obj.calculator.get_total_of_usable_vials()[0]

    def get_stock_of_unusable_vials(self, obj):
        return obj.calculator.get_total_of_unusable_vials()[0]

    def get_vials_destroyed(self, obj):
        return obj.calculator.get_vials_destroyed()[0]

    def get_stock_of_earmarked_vials(self, obj):
        return obj.calculator.get_total_of_earmarked()[0]

    def get_doses_received(self, obj):
        return obj.calculator.get_vials_received()[1]

    def get_doses_used(self, obj):
        return obj.calculator.get_vials_used()[1]

    def get_stock_of_usable_doses(self, obj):
        return obj.calculator.get_total_of_usable_vials()[1]

    def get_stock_of_unusable_doses(self, obj):
        return obj.calculator.get_total_of_unusable_vials()[1]

    def get_doses_destroyed(self, obj):
        return obj.calculator.get_vials_destroyed()[1]

    def get_stock_of_earmarked_doses(self, obj):
        return obj.calculator.get_total_of_earmarked()[1]


class VaccineStockCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccineStock
        fields = ["country", "vaccine"]

    def create(self, validated_data):
        validated_data["account"] = self.context["request"].user.iaso_profile.account

        return VaccineStock.objects.create(**validated_data)


class StockManagementCustomFilter(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, _view):
        country_id = request.GET.get("country_id")
        vaccine_type = request.GET.get("vaccine_type")
        country_blocks = request.GET.get("country_blocks", None)

        if country_id:
            queryset = queryset.filter(country_id__in=country_id.split(","))
        if vaccine_type:
            queryset = queryset.filter(vaccine=vaccine_type)
        if country_blocks:
            try:
                queryset = queryset.filter(country__groups__in=country_blocks.split(","))
            except:
                pass

        current_order = request.GET.get("order")

        if current_order:
            if current_order == "country_name":
                queryset = queryset.order_by("country__name")
            elif current_order == "-country_name":
                queryset = queryset.order_by("-country__name")
            elif current_order == "vaccine_type":
                queryset = queryset.order_by("vaccine")
            elif current_order == "-vaccine_type":
                queryset = queryset.order_by("-vaccine")

        return queryset


class VaccineStockSubitemBase(ModelViewSet):
    allowed_methods = ["get", "post", "head", "options", "patch", "delete"]
    model_class = None

    @swagger_auto_schema(
        manual_parameters=[vaccine_stock_id_param],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        vaccine_stock_id = self.request.query_params.get("vaccine_stock")
        order = self.request.query_params.get("order")

        if self.model_class is None:
            raise NotImplementedError("model_class must be defined")

        queryset = self.model_class.objects.filter(vaccine_stock__account=self.request.user.iaso_profile.account)

        if vaccine_stock_id is not None:
            queryset = queryset.filter(vaccine_stock=vaccine_stock_id)

        if order:
            queryset = queryset.order_by(order)

        return queryset


class VaccineStockSubitemEdit(VaccineStockSubitemBase):
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Extract campaign data
        campaign_data = serializer.validated_data.get("campaign")
        round_data = serializer.validated_data.get("round")

        campaign = None
        _round = None

        if campaign_data:
            campaign_obr_name = campaign_data.get("obr_name")
            campaign = Campaign.objects.get(obr_name=campaign_obr_name, account=request.user.iaso_profile.account)

            if round_data:
                round_number = round_data.get("number")
                _round = campaign.rounds.get(number=round_number)

        # Update validated data
        serializer.validated_data["campaign"] = campaign
        serializer.validated_data["round"] = _round

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Extract campaign data
        campaign_data = serializer.validated_data.get("campaign")
        round_data = serializer.validated_data.get("round")

        campaign = None
        _round = None

        if campaign_data:
            campaign_obr_name = campaign_data.get("obr_name")
            campaign = Campaign.objects.get(obr_name=campaign_obr_name, account=request.user.iaso_profile.account)

            if round_data:
                round_number = round_data.get("number")
                _round = campaign.rounds.get(number=round_number)

        serializer.validated_data["campaign"] = campaign
        serializer.validated_data["round"] = _round

        self.perform_update(serializer)
        return Response(serializer.data)


def compute_category_from_campaign(campaign: Optional[Campaign], round: Optional[Round]) -> str:
    if campaign is None:
        return CampaignCategory.REGULAR
    if campaign.is_test:
        return CampaignCategory.TEST_CAMPAIGN
    if campaign.on_hold:
        return CampaignCategory.CAMPAIGN_ON_HOLD
    if not campaign.rounds.exclude(on_hold=True).exists():
        return CampaignCategory.ALL_ROUNDS_ON_HOLD
    if round is not None and round.on_hold:
        return CampaignCategory.ROUND_ON_HOLD
    return CampaignCategory.REGULAR


class OutgoingStockMovementSerializer(ModelWithFileSerializer):
    campaign = serializers.CharField(source="campaign.obr_name", required=False)
    # reference to a campaign not managed in iaso. Is used as an alternative to the campaign/obr name used for regular campaigns
    alternative_campaign = serializers.CharField(source="non_obr_name", required=False)
    round_number = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    campaign_category = serializers.SerializerMethodField()

    class Meta:
        model = OutgoingStockMovement
        fields = [
            "id",
            "campaign",
            "vaccine_stock",
            "report_date",
            "form_a_reception_date",
            "usable_vials_used",
            "lot_numbers",
            "scan_result",
            "scan_timestamp",
            "file",
            "comment",
            "round",
            "round_number",
            "can_edit",
            "alternative_campaign",
            "campaign_category",
            "doses_per_vial",
        ]

    def validate(self, data):
        # The `source` attribute is used as the key in `data` instead of the name of the serializer field.
        if data.get("campaign", None) and data.get("non_obr_name", None):
            raise serializers.ValidationError({"error": "campaign and alternative campaign cannot both be defined"})

        validated_data = super().validate(data)
        return validated_data

    def get_round_number(self, obj):
        return obj.round.number if obj.round else None

    def get_can_edit(self, obj):
        return can_edit_helper(
            self.context["request"].user,
            obj.created_at,
            admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
        )

    def get_campaign_category(self, obj):
        return compute_category_from_campaign(obj.campaign, obj.round)

    def extract_campaign_data(self, validated_data):
        campaign_data = validated_data.pop("campaign", None)
        if campaign_data:
            campaign_obr_name = campaign_data.get("obr_name")
            campaign = Campaign.objects.get(
                obr_name=campaign_obr_name,
                account=self.context["request"].user.iaso_profile.account,
            )
            return campaign
        return None

    def create(self, validated_data):
        campaign = self.extract_campaign_data(validated_data)
        if campaign:
            validated_data["campaign"] = campaign
        self.scan_file_if_exists(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        campaign = self.extract_campaign_data(validated_data)
        if campaign:
            instance.campaign = campaign
        self.scan_file_if_exists(validated_data, instance)
        return super().update(instance, validated_data)


class OutgoingStockMovementStrictSerializer(OutgoingStockMovementSerializer):
    def validate(self, data):
        # The `source` attribute is used as the key in `data` instead of the name of the serializer field.
        if data.get("campaign", None) is None and data.get("non_obr_name", None) is None:
            raise serializers.ValidationError(
                {"error": "At least one of 'campaign' or 'alternative campaign' must be provided"}
            )
        validated_data = super().validate(data)
        return validated_data


class OutgoingStockMovementPatchSerializer(OutgoingStockMovementSerializer):
    campaign = serializers.CharField(source="campaign.obr_name", required=False, allow_null=True)
    alternative_campaign = serializers.CharField(source="non_obr_name", required=False, allow_blank=True)


class OutgoingStockMovementViewSet(VaccineStockSubitemBase):
    model_class = OutgoingStockMovement
    permission_classes = [
        lambda: VaccineStockPermission(
            admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
        )
    ]
    filter_backends = [
        filters.OrderingFilter,
    ]
    ordering_fields = ["report_date", "form_a_reception_date", "doses_per_vial"]

    def get_serializer_class(self):
        if self.action == "partial_update":
            return OutgoingStockMovementPatchSerializer
        return OutgoingStockMovementStrictSerializer

    def get_queryset(self):
        vaccine_stock_id = self.request.query_params.get("vaccine_stock")

        base_queryset = OutgoingStockMovement.objects.all()

        if vaccine_stock_id is None:
            return base_queryset.filter(vaccine_stock__account=self.request.user.iaso_profile.account)

        return base_queryset.filter(
            vaccine_stock=vaccine_stock_id, vaccine_stock__account=self.request.user.iaso_profile.account
        )

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)

        # When Form A is created, find if there is a matching earmarked stock
        # and create a new earmarked stock of type USED with the same values
        if response.status_code == 201:
            movement = OutgoingStockMovement.objects.filter(id=response.data["id"]).first()
            if movement and movement.round and movement.vaccine_stock:
                total_vials_usable = EarmarkedStock.get_available_vials_count(
                    movement.vaccine_stock, movement.round, movement.doses_per_vial
                )

                vials_earmarked_used = min(total_vials_usable, movement.usable_vials_used)
                doses_earmarked_used = vials_earmarked_used * movement.doses_per_vial

                if vials_earmarked_used > 0:
                    EarmarkedStock.objects.create(
                        vaccine_stock=movement.vaccine_stock,
                        campaign=movement.campaign,
                        round=movement.round,
                        earmarked_stock_type=EarmarkedStock.EarmarkedStockChoices.USED,
                        vials_earmarked=vials_earmarked_used,
                        doses_earmarked=doses_earmarked_used,
                        comment="Created from Form A submission",
                        form_a=movement,
                        doses_per_vial=movement.doses_per_vial,
                    )

        return response


class IncidentReportSerializer(ModelWithFileSerializer):
    file = serializers.FileField(required=False)
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = IncidentReport
        exclude = ["file_last_scan", "file_scan_status"]

    def get_can_edit(self, obj):
        return can_edit_helper(
            self.context["request"].user,
            obj.created_at,
            admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
        )

    def create(self, validated_data):
        self.scan_file_if_exists(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        self.scan_file_if_exists(validated_data)
        return super().update(instance, validated_data)


class IncidentReportViewSet(VaccineStockSubitemBase):
    serializer_class = IncidentReportSerializer
    model_class = IncidentReport
    permission_classes = [
        lambda: VaccineStockPermission(
            admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
        )
    ]
    ordering_fields = ["doses_per_vial"]


class DestructionReportSerializer(ModelWithFileSerializer):
    file = serializers.FileField(required=False)
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = DestructionReport
        exclude = ["file_last_scan", "file_scan_status"]

    def get_can_edit(self, obj):
        return can_edit_helper(
            self.context["request"].user,
            obj.created_at,
            admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
        )

    def create(self, validated_data):
        self.scan_file_if_exists(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        self.scan_file_if_exists(validated_data)
        return super().update(instance, validated_data)


class DestructionReportViewSet(VaccineStockSubitemBase):
    serializer_class = DestructionReportSerializer
    model_class = DestructionReport
    permission_classes = [
        lambda: VaccineStockPermission(
            admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
        )
    ]
    ordering_fields = ["doses_per_vial"]

    @action(detail=False, methods=["GET"])
    def check_duplicate(self, request):
        vaccine_stock_id = request.query_params.get("vaccine_stock")
        destruction_report_date = request.query_params.get("destruction_report_date")
        unusable_vials_destroyed = request.query_params.get("unusable_vials_destroyed")
        destruction_report_id = request.query_params.get("destruction_report_id")

        if not all([vaccine_stock_id, destruction_report_date, unusable_vials_destroyed]):
            return Response({"error": "Missing required parameters"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if vaccine stock exists
        if not VaccineStock.objects.filter(id=vaccine_stock_id).exists():
            return Response({"error": "Vaccine stock not found"}, status=status.HTTP_404_NOT_FOUND)

        # Build the filter query
        filter_query = {
            "vaccine_stock_id": vaccine_stock_id,
            "destruction_report_date": destruction_report_date,
            "unusable_vials_destroyed": unusable_vials_destroyed,
        }

        # If editing an existing report, exclude it from the duplicate check
        if destruction_report_id:
            existing_destruction = (
                DestructionReport.objects.exclude(id=destruction_report_id).filter(**filter_query).exists()
            )
        else:
            existing_destruction = DestructionReport.objects.filter(**filter_query).exists()

        return Response({"duplicate_exists": existing_destruction})


class EarmarkedStockSerializer(serializers.ModelSerializer):
    campaign = serializers.SerializerMethodField()
    round_number = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    campaign_category = serializers.SerializerMethodField()

    class Meta:
        model = EarmarkedStock
        fields = [
            "id",
            "vaccine_stock",
            "campaign",
            "temporary_campaign_name",
            "round_number",
            "form_a",
            "earmarked_stock_type",
            "vials_earmarked",
            "doses_earmarked",
            "comment",
            "created_at",
            "updated_at",
            "can_edit",
            "campaign_category",
            "doses_per_vial",
        ]

    def get_can_edit(self, obj):
        return can_edit_helper(
            self.context["request"].user,
            obj.created_at,
            admin_perm=POLIO_VACCINE_STOCK_EARMARKS_ADMIN_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_EARMARKS_NONADMIN_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_EARMARKS_READ_ONLY_PERMISSION,
        )

    def get_campaign_category(self, obj):
        return compute_category_from_campaign(obj.campaign, obj.round)

    def get_campaign(self, obj):
        return obj.campaign.obr_name if obj.campaign else None

    def get_round_number(self, obj):
        return obj.round.number if obj.round else None

    def create(self, validated_data):
        campaign = None
        round_obj = None

        campaign_data = self.initial_data.get("campaign", None)
        round_number = self.initial_data.get("round_number", None)

        if campaign_data:
            campaign = Campaign.objects.get(
                obr_name=campaign_data,
                account=self.context["request"].user.iaso_profile.account,
            )
            if round_number:
                round_obj = campaign.rounds.get(number=round_number)

        validated_data["campaign"] = campaign
        validated_data["round"] = round_obj

        return super().create(validated_data)

    def update(self, instance, validated_data):
        campaign = None
        round_obj = None

        campaign_data = self.initial_data.get("campaign", None)
        round_number = self.initial_data.get("round_number", None)

        if campaign_data:
            campaign = Campaign.objects.get(
                obr_name=campaign_data,
                account=self.context["request"].user.iaso_profile.account,
            )
            if round_number:
                round_obj = campaign.rounds.get(number=round_number)

        validated_data["campaign"] = campaign
        validated_data["round"] = round_obj

        return super().update(instance, validated_data)


class EarmarkedStockFilter(FilterSet):
    vaccine_stock = NumberFilter(field_name="vaccine_stock_id")

    class Meta:
        model = EarmarkedStock
        fields = ["vaccine_stock"]


class EarmarkedStockViewSet(VaccineStockSubitemEdit):
    serializer_class = EarmarkedStockSerializer
    model_class = EarmarkedStock
    filterset_class = EarmarkedStockFilter
    permission_classes = [
        lambda: VaccineStockEarmarkPermission(
            admin_perm=POLIO_VACCINE_STOCK_EARMARKS_ADMIN_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_EARMARKS_NONADMIN_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_EARMARKS_READ_ONLY_PERMISSION,
        )
    ]
    ordering_fields = ["doses_per_vial"]

    def get_queryset(self):
        return (
            EarmarkedStock.objects.filter(vaccine_stock__account=self.request.user.iaso_profile.account)
            .select_related("vaccine_stock", "campaign", "round")
            .filter(Q(temporary_campaign_name="") & Q(round__on_hold=False) | ~Q(temporary_campaign_name=""))
        )


class VaccineStockManagementViewSet(ModelViewSet):
    """
    ViewSet for managing Vaccine Stock data.

    This ViewSet provides actions to retrieve and manage stock information
    for vaccines, including summaries of usable and unusable vials, and
    detailed movements such as arrivals, destructions, and incidents.

    Available endpoints :

    GET /api/polio/vaccine/vaccine_stock/
    Return a list of summary informations for a VaccineStock. (Used by the Vaccine Stock list view)

    POST /api/polio/vaccine/vaccine_stock/
    Add a new VaccineStock.

    GET /api/polio/vaccine/vaccine_stock/{id}/
    Return a specific item from the previous list.

    DELETE /api/polio/vaccine/vaccine_stock/{id}/
    Delete a vaccine stock. All related OutgoingMovements, IncidentReports and Destructions will also be deleted.

    GET /api/polio/vaccine/vaccine_stock/{id}/summary/
    Return a summary of vaccine stock for a given VaccineStock ID (Used on detail page)

    GET /api/polio/vaccine/vaccine_stock/{id}/usable_vials/
    Return a detailed list of movements for usable vials associated with a given VaccineStock ID.

    GET /api/polio/vaccine/vaccine_stock/{id}/unusable_vials/
    Return a detailed list of movements for unusable vials associated with a given VaccineStock ID.



    """

    permission_classes = [
        lambda: VaccineStockPermission(
            admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
        )
    ]
    serializer_class = VaccineStockSerializer
    http_method_names = ["get", "head", "options", "post", "delete"]

    model = VaccineStock

    filter_backends = [SearchFilter, StockManagementCustomFilter]
    search_fields = ["vaccine", "country__name"]

    # We need to override this method to add the calculator on the instance
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if isinstance(instance, VaccineStock):
            instance.calculator = VaccineStockCalculator(instance)
        else:
            return Response({"error": "VaccineStock not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request):
        """
        Add a new VaccineStock.

        This endpoint is used to add a new VaccineStock to the database.
        The request body should include the country ID and vaccine type.
        """
        serializer = VaccineStockCreateSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"])
    def summary(self, _, pk=None):
        """
        Retrieve a summary of vaccine stock for a given VaccineStock ID.

        The summary includes the country name, vaccine type, total usable and unusable vials,
        and corresponding doses.
        """
        if pk is None:
            return Response(
                {"error": "No VaccineStock ID provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            vaccine_stock = self.get_queryset().get(id=pk)
        except VaccineStock.DoesNotExist:
            return Response(
                {"error": "VaccineStock not found for "},
                status=status.HTTP_404_NOT_FOUND,
            )

        calculator = VaccineStockCalculator(vaccine_stock)

        _, total_usable_doses = calculator.get_total_of_usable_vials()
        (
            _,
            total_unusable_doses,
        ) = calculator.get_total_of_unusable_vials()
        (
            _,
            total_earmarked_doses,
        ) = calculator.get_total_of_earmarked()

        summary_data = {
            "country_id": vaccine_stock.country.id,
            "country_name": vaccine_stock.country.name,
            "vaccine_type": vaccine_stock.vaccine,
            "total_usable_doses": total_usable_doses,
            "total_earmarked_doses": total_earmarked_doses,
            "total_unusable_doses": total_unusable_doses,
        }

        return Response(summary_data, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["get"],
    )
    def usable_vials(self, request, pk=None):
        """
        Retrieve a detailed list of movements for usable vials associated with a given VaccineStock ID.

        This includes information on stock arrivals, destructions, incidents, and outgoing stock movements.
        Each movement is timestamped and includes the number of vials and doses affected.
        """
        if pk is None:
            return Response(
                {"error": "No VaccineStock ID provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            vaccine_stock = self.get_queryset().get(id=pk)
        except VaccineStock.DoesNotExist:
            return Response({"error": "VaccineStock not found"}, status=status.HTTP_404_NOT_FOUND)

        end_date = request.query_params.get("end_date", None)
        if end_date:
            parsed_end_date = parse_date(end_date)
            if not parsed_end_date:
                raise ValidationError("The 'end_date' query parameter is not a valid date.")

        calc = VaccineStockCalculator(vaccine_stock)
        results = calc.get_list_of_usable_vials(end_date)
        results = sort_results(request, results)

        export_xlsx = request.query_params.get("export_xlsx", False)

        if export_xlsx:
            today = date.today().isoformat()
            filename = f"{today}-{vaccine_stock.country.name}-{vaccine_stock.vaccine}-stock-card-export"
            workbook = download_xlsx_stock_variants(
                request,
                filename,
                results,
                {
                    "Unusable": lambda: calc.get_list_of_unusable_vials(end_date),
                    "Earmarked": lambda: calc.get_list_of_earmarked(end_date),
                },
                vaccine_stock,
                "Usable",
            )
            with NamedTemporaryFile() as tmp:
                workbook.save(tmp.name)
                tmp.seek(0)
                stream = tmp.read()

            response = HttpResponse(stream, content_type=CONTENT_TYPE_XLSX)
            response["Content-Disposition"] = "attachment; filename=%s" % filename + ".xlsx"
            return response

        paginator = Paginator()
        page = paginator.paginate_queryset(results, request)
        if page is not None:
            return paginator.get_paginated_response(page)
        return Response({"results": results})

    @action(detail=True, methods=["get"])
    def get_unusable_vials(self, request, pk=None):
        """
        Retrieve a detailed list of movements for unusable vials associated with a given VaccineStock ID.

        This includes information on outgoing stock movements and incident reports
        that resulted in unusable vials, with each movement timestamped and including
        the number of vials and doses affected.
        """

        if pk is None:
            return Response(
                {"error": "No VaccineStock ID provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            vaccine_stock = self.get_queryset().get(id=pk)
        except VaccineStock.DoesNotExist:
            return Response({"error": "VaccineStock not found"}, status=status.HTTP_404_NOT_FOUND)

        end_date = request.query_params.get("end_date", None)
        if end_date:
            parsed_end_date = parse_date(end_date)
            if not parsed_end_date:
                raise ValidationError("The 'end_date' query parameter is not a valid date.")

        calc = VaccineStockCalculator(vaccine_stock, end_date)
        results = calc.get_list_of_unusable_vials()
        results = sort_results(request, results)

        export_xlsx = request.query_params.get("export_xlsx", False)

        if export_xlsx:
            today = date.today().isoformat()
            filename = f"{today}-{vaccine_stock.country.name}-{vaccine_stock.vaccine}-stock-card-export"
            workbook = download_xlsx_stock_variants(
                request,
                filename,
                results,
                {
                    "Usable": lambda: calc.get_list_of_usable_vials(),
                    "Earmarked": lambda: calc.get_list_of_earmarked(),
                },
                vaccine_stock,
                "Unusable",
            )
            with NamedTemporaryFile() as tmp:
                workbook.save(tmp.name)
                tmp.seek(0)
                stream = tmp.read()

            response = HttpResponse(stream, content_type=CONTENT_TYPE_XLSX)
            response["Content-Disposition"] = "attachment; filename=%s" % filename + ".xlsx"
            return response

        paginator = Paginator()
        page = paginator.paginate_queryset(results, request)
        if page is not None:
            return paginator.get_paginated_response(page)
        return Response({"results": results})

    def get_serializer_class(self):
        if self.action == "create":
            return VaccineStockCreateSerializer
        return VaccineStockSerializer

    def get_queryset(self):
        """
        Get the queryset for VaccineStock objects.

        The queryset is filtered by the account of the logged-in user and includes
        related destruction reports, incident reports, and outgoing stock movements.
        It is ordered by the VaccineStock ID.
        """

        accessible_org_units = OrgUnit.objects.filter_for_user_and_app_id(
            self.request.user, self.request.query_params.get("app_id")
        )
        accessible_org_units_ids = accessible_org_units.values_list("id", flat=True)

        return (
            VaccineStock.objects.filter(
                account=self.request.user.iaso_profile.account,
                country__id__in=accessible_org_units_ids,
            )
            .prefetch_related(
                "destructionreport_set",
                "incidentreport_set",
                "outgoingstockmovement_set",
                "earmarked_stocks",
            )
            .distinct()
            .order_by("id")
        )

    @action(detail=False, methods=["get"])
    def doses_options(self, request):
        """_summary_
        Uses the VaccineArrivalReports as source of truth for available dose_per_vial values and returns a list of dropdown options with available values
        """
        stock_id = request.GET.get("stockId", None)
        if not stock_id:
            return Response("stock id not provided", status=status.HTTP_400_BAD_REQUEST)
        try:
            stock_id = int(stock_id)
        except:
            return Response("stock id must be a number", status=status.HTTP_400_BAD_REQUEST)

        vaccine_stock = VaccineStock.objects.filter(id=stock_id).first()
        if not vaccine_stock:
            return Response(status=status.HTTP_404_NOT_FOUND)

        vaccine = vaccine_stock.vaccine
        try:
            config = Config.objects.get(slug=DOSES_PER_VIAL_CONFIG_SLUG)
        except Config.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        options = config.content[vaccine]
        calculator = VaccineStockCalculator(vaccine_stock)
        doses_available = calculator.get_usable_stock_by_vaccine_presentation()
        unusable_doses = calculator.get_unusable_stock_by_vaccine_presentation()
        results = []
        for option in options:
            results.append(
                {
                    "label": str(option),
                    "value": option,
                    "doses_available": doses_available[str(option)],
                    "unusable_doses": unusable_doses[str(option)],
                }
            )
        return Response({"results": results}, status=status.HTTP_200_OK)


class EmbeddedVaccineStockManagementViewset(VaccineStockManagementViewSet):
    """
    Publicly available version of the VaccineStockManagement API
    Used for embedding a view in RRT's website.
    We don't just change the existing API, because inside iaso, we still need to restrict some access based on user country.
    """

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    http_method_names = ["get", "head", "options"]
