from rest_framework import serializers, viewsets

from hat.menupermissions import models as permission
from iaso.api.common import GenericReadWritePerm, ModelViewSet
from plugins.polio.models import VaccineArrivalReport, VaccinePreAlert, VaccineRequestForm


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


class VaccinePreAlertViewSet(ModelViewSet):
    permission_classes = [VaccineRequestReadWritePerm]
    queryset = VaccinePreAlert.objects.all()
    serializer_class = VaccinePreAlertSerializer


class VaccineArrivalReportViewSet(ModelViewSet):
    permission_classes = [VaccineRequestReadWritePerm]
    queryset = VaccineArrivalReport.objects.all()
    serializer_class = VaccineArrivalReportSerializer
