from rest_framework import serializers, viewsets

from hat.menupermissions import models as permission
from iaso.api.common import GenericReadWritePerm, ModelViewSet
from plugins.polio.models import VaccineArrivalReport, VaccinePreAlert, VaccineRequestForm
from django import forms
from plugins.polio.api.vaccines.vaccine_authorization import CountryForVaccineSerializer


def validate_rounds_and_campaign(data):
    rounds = data.get("rounds")
    campaign = data.get("campaign")

    if not rounds:
        raise forms.ValidationError("At least one round must be attached.")

    for round in rounds.all():
        if round.campaign != campaign:
            raise forms.ValidationError("Each round's campaign must be the same as the form's campaign.")

    if data.get("country").org_unit_type.category != "COUNTRY":
        raise forms.ValidationError("The selected OrgUnit must be of type 'Country'.")

    return data


class VaccineRequestReadWritePerm(GenericReadWritePerm):
    read_perm = permission.POLIO_VACCINE_SUPPLY_CHAIN_READ
    write_perm = permission.POLIO_VACCINE_SUPPLY_CHAIN_WRITE


class VaccineRequestFormSerializer(serializers.ModelSerializer):
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
    serializer_class = VaccineRequestFormSerializer


class VaccinePreAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccinePreAlert
        fields = "__all__"


class VaccineArrivalReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccineArrivalReport
        fields = "__all__"

    def validate(self, data):
        return validate_rounds_and_campaign(data)


class VaccinePreAlertViewSet(ModelViewSet):
    permission_classes = [VaccineRequestReadWritePerm]
    queryset = VaccinePreAlert.objects.all()
    serializer_class = VaccinePreAlertSerializer


class VaccineArrivalReportViewSet(ModelViewSet):
    permission_classes = [VaccineRequestReadWritePerm]
    queryset = VaccineArrivalReport.objects.all()
    serializer_class = VaccineArrivalReportSerializer
