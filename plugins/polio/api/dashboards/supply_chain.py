from rest_framework import serializers
from iaso.api.common import ModelViewSet
from plugins.polio.api.vaccines.supply_chain import VaccineSupplyChainReadWritePerm
from plugins.polio.models import VaccineArrivalReport, VaccinePreAlert, VaccineRequestForm


class VaccineRequestFormDashboardSerializer(serializers.ModelSerializer):
    obr_name = serializers.CharField(source="campaign.obr_name")
    country = serializers.SerializerMethodField()

    class Meta:
        model = VaccineRequestForm
        fields = "__all__"

    def get_country(self, obj):
        return obj.campaign.country.pk


class VaccineRequestFormDashboardViewSet(ModelViewSet):
    """
    GET /api/polio/dashboards/vaccine_request_forms/
    Returns all vaccine request forms for the user's account.
    Simple endpoint that returns all model fields to facilitate data manipulation by OpenHexa or PowerBI
    2 additional fields have been added:
    - obr_name: the campaign's OBR name, that may need to be displayed
    - country: the id of the vaccine request form's country
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
