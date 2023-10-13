from rest_framework import serializers, viewsets

from hat.menupermissions import models as permission
from iaso.api.common import GenericReadWritePerm, ModelViewSet
from plugins.polio.models import VaccineArrivalReport, VaccinePreAlert, VaccineRequestForm
from django import forms


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
    class Meta:
        model = VaccineRequestForm
        fields = "__all__"


class VaccinePreAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccinePreAlert
        fields = "__all__"


class VaccineArrivalReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccineArrivalReport
        fields = "__all__"


class VaccineRequestFormViewSet(ModelViewSet):
    permission_classes = [VaccineRequestReadWritePerm]
    queryset = VaccineRequestForm.objects.all()
    serializer_class = VaccineRequestFormSerializer

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
