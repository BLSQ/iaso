from django import forms
from rest_framework import filters, serializers, viewsets

from hat.menupermissions import models as permission
from iaso.api.common import GenericReadWritePerm, ModelViewSet
from plugins.polio.api.vaccines.vaccine_authorization import CountryForVaccineSerializer
from plugins.polio.models import VaccineArrivalReport, VaccinePreAlert, VaccineRequestForm
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore


def validate_rounds_and_campaign(data, current_user=None):
    rounds = data.get("rounds")
    campaign = data.get("campaign")

    if not rounds:
        raise forms.ValidationError("At least one round must be attached.")

    for round in rounds.all():
        if round.campaign != campaign:
            raise forms.ValidationError("Each round's campaign must be the same as the form's campaign.")

    if data.get("country").org_unit_type.category != "COUNTRY":
        raise forms.ValidationError("The selected OrgUnit must be of type 'Country'.")

    if current_user:
        if not current_user.iaso_profile.account == data.get("campaign").account:
            raise forms.ValidationError("The selected account must be the same as the user's account.")

    return data


class VaccineRequestReadWritePerm(GenericReadWritePerm):
    read_perm = permission.POLIO_VACCINE_SUPPLY_CHAIN_READ
    write_perm = permission.POLIO_VACCINE_SUPPLY_CHAIN_WRITE


class VaccineRequestFormPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccineRequestForm
        fields = [
            "country",
            "campaign",
            "vaccine_type",
            "rounds",
            "date_vrf_signature",
            "date_vrf_reception",
            "date_dg_approval",
            "quantities_ordered_in_doses",
            "wastage_rate_used_on_vrf",
            "date_vrf_submission_to_orpg",
            "quantities_approved_by_orpg_in_doses",
            "date_rrt_orpg_approval",
            "date_vrf_submitted_to_dg",
            "quantities_approved_by_dg_in_doses",
            "comment",
        ]

    def validate(self, data):
        return validate_rounds_and_campaign(data, self.context["request"].user)

    def create(self, validated_data):
        user = self.context["request"].user
        assert "campaign" in validated_data and validated_data["campaign"].account == user.iaso_profile.account
        validated_data["country"] = validated_data["campaign"].country
        return super().create(validated_data)


class VaccineRequestFormListSerializer(serializers.ModelSerializer):
    country = CountryForVaccineSerializer()
    vaccine = serializers.CharField(source="vaccine_type")
    obr_name = serializers.CharField(source="campaign.obr_name")
    po_numbers = serializers.SerializerMethodField()
    rounds = serializers.SerializerMethodField()
    start_date = serializers.SerializerMethodField()
    end_date = serializers.SerializerMethodField()
    doses_shipped = serializers.SerializerMethodField()
    eta = serializers.SerializerMethodField()
    var = serializers.SerializerMethodField()

    class Meta:
        model = VaccineRequestForm
        fields = (
            "id",
            "country",
            "vaccine",
            "obr_name",
            "po_numbers",
            "rounds",
            "start_date",
            "end_date",
            "doses_shipped",
            "eta",
            "var",
        )

    def get_po_numbers(self, obj):
        return [pre_alert.po_number for pre_alert in obj.vaccineprealert_set.all()]

    def get_rounds(self, obj):
        return [round.number for round in obj.rounds.all()]

    def get_start_date(self, obj):
        return obj.rounds.all().first().started_at

    def get_end_date(self, obj):
        return obj.rounds.all().last().ended_at

    def get_doses_shipped(self, obj):
        return obj.total_doses_shipped()

    # Not sure if I should get the first, the last or a comma separated list of all
    def get_eta(self, obj):
        return obj.vaccineprealert_set.all().first().estimated_arrival_time

    # Not sure if I should get the first, the last or a comma separated list of all
    def get_var(self, obj):
        return obj.vaccinearrivalreport_set.all().first().arrival_report_date


class VaccineRequestFormViewSet(ModelViewSet):
    permission_classes = [VaccineRequestReadWritePerm]
    queryset = VaccineRequestForm.objects.all()
    http_method_names = ["get", "post", "delete"]

    def get_serializer_class(self):
        if self.action == "list":
            return VaccineRequestFormListSerializer
        else:
            return VaccineRequestFormPostSerializer


class VaccinePreAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccinePreAlert
        fields = "__all__"


class VaccineArrivalReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccineArrivalReport
        fields = "__all__"


class VaccinePreAlertViewSet(ModelViewSet):
    permission_classes = [VaccineRequestReadWritePerm]
    serializer_class = VaccinePreAlertSerializer
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]

    def get_queryset(self):
        return VaccinePreAlert.objects.filter(request_form__campaign__account=self.request.user.iaso_profile.account)


class VaccineArrivalReportViewSet(ModelViewSet):
    permission_classes = [VaccineRequestReadWritePerm]
    serializer_class = VaccineArrivalReportSerializer

    def get_queryset(self):
        return VaccineArrivalReport.objects.filter(
            request_form__campaign__account=self.request.user.iaso_profile.account
        )
