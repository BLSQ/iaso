from rest_framework import serializers

from iaso.api.common import ModelViewSet
from plugins.polio.api.vaccines.stock_management import VaccineStockCalculator
from plugins.polio.api.vaccines.supply_chain import VaccineSupplyChainReadWritePerm
from plugins.polio.models import (
    DestructionReport,
    OutgoingStockMovement,
    VaccineArrivalReport,
    VaccinePreAlert,
    VaccineRequestForm,
    VaccineStock,
)


class VaccineRequestFormDashboardSerializer(serializers.ModelSerializer):
    obr_name = serializers.CharField(source="campaign.obr_name")
    country = serializers.IntegerField(source="campaign.country.pk")
    stock_in_hand = serializers.IntegerField(read_only=True)
    form_a_reception_date = serializers.DateField(read_only=True)
    destruction_report_reception_date = serializers.DateField(read_only=True)

    class Meta:
        model = VaccineRequestForm
        fields = "__all__"

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        accnt = self.context["request"].user.iaso_profile.account

        vaccine_stock, _ = VaccineStock.objects.get_or_create(
            country=instance.campaign.country, vaccine=instance.vaccine_type, account=accnt
        )

        representation["stock_in_hand"] = self.get_stock_in_hand(instance, vaccine_stock)
        representation["form_a_reception_date"] = self.get_form_a_reception_date(vaccine_stock)
        representation["destruction_report_reception_date"] = self.get_destruction_report_reception_date(vaccine_stock)

        return representation

    def get_stock_in_hand(self, obj, vaccine_stock):
        # Create a cache dictionary in the context if it doesn't exist
        if "stock_in_hand_cache" not in self.context:
            self.context["stock_in_hand_cache"] = {}

        # Create a unique key for this country and vaccine type
        cache_key = f"{obj.campaign.country.pk}_{obj.vaccine_type}"

        # If the value is not in the cache, calculate it
        if cache_key not in self.context["stock_in_hand_cache"]:
            vaccine_stock_calculator = VaccineStockCalculator(vaccine_stock)
            self.context["stock_in_hand_cache"][cache_key] = vaccine_stock_calculator.get_stock_of_usable_vials()

        return self.context["stock_in_hand_cache"][cache_key]

    def get_form_a_reception_date(self, vaccine_stock):
        latest_outgoing_stock_movement = (
            OutgoingStockMovement.objects.filter(vaccine_stock=vaccine_stock).order_by("-form_a_reception_date").first()
        )
        return latest_outgoing_stock_movement.form_a_reception_date if latest_outgoing_stock_movement else None

    def get_destruction_report_reception_date(self, vaccine_stock):
        latest_destruction_report = (
            DestructionReport.objects.filter(vaccine_stock=vaccine_stock)
            .order_by("-rrt_destruction_report_reception_date")
            .first()
        )
        return latest_destruction_report.rrt_destruction_report_reception_date if latest_destruction_report else None


class VaccineRequestFormDashboardViewSet(ModelViewSet):
    """
    GET /api/polio/dashboards/vaccine_request_forms/
    Returns all vaccine request forms for the user's account.
    Simple endpoint that returns all model fields to facilitate data manipulation by OpenHexa or PowerBI
    3 additional fields have been added:
    - obr_name: the campaign's OBR name, that may need to be displayed
    - country: the id of the vaccine request form's country
    - stock_in_hand: the stock in hand calculated from VaccineStockCalculator
    - get_form_a_reception_date: Form A reception (RRT) date
    - get_destruction_report_reception_date: Destruction Report Received by RRT date
    """

    http_method_names = ["get"]
    permission_classes = [VaccineSupplyChainReadWritePerm]
    model = VaccineRequestForm
    serializer_class = VaccineRequestFormDashboardSerializer

    def get_queryset(self):
        return VaccineRequestForm.objects.filter(
            campaign__account=self.request.user.iaso_profile.account
        ).select_related("campaign__country")


class VaccinePreAlertDashboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccinePreAlert
        fields = "__all__"


class PreAlertDashboardViewSet(ModelViewSet):
    """
    GET /api/polio/dashboards/pre_alerts/
    Returns all vaccine pre alerts for the user's account.
    Simple endpoint that returns all model fields to facilitate data manipulation by OpenHexa or PowerBI
    """

    http_method_names = ["get"]
    permission_classes = [VaccineSupplyChainReadWritePerm]
    model = VaccinePreAlert
    serializer_class = VaccinePreAlertDashboardSerializer

    def get_queryset(self):
        return VaccinePreAlert.objects.filter(request_form__campaign__account=self.request.user.iaso_profile.account)


class VaccineArrivalReportDashboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccineArrivalReport
        fields = "__all__"


class VaccineArrivalReportDashboardViewSet(ModelViewSet):
    """
    GET /api/polio/dashboards/arrival_reports/
    Returns all vaccine arrival reports for the user's account.
    Simple endpoint that returns all model fields to facilitate data manipulation by OpenHexa or PowerBI
    """

    http_method_names = ["get"]
    permission_classes = [VaccineSupplyChainReadWritePerm]
    model = VaccinePreAlert
    serializer_class = VaccineArrivalReportDashboardSerializer

    def get_queryset(self):
        return VaccineArrivalReport.objects.filter(
            request_form__campaign__account=self.request.user.iaso_profile.account
        )
