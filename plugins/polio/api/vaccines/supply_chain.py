from rest_framework import serializers, viewsets
from plugins.polio.models import VaccineRequestForm, VaccinePreAlert, VaccineArrivalReport
from iaso.api.common import ModelViewSet


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
    queryset = VaccineRequestForm.objects.all()
    serializer_class = VaccineRequestFormSerializer


class VaccinePreAlertViewSet(ModelViewSet):
    queryset = VaccinePreAlert.objects.all()
    serializer_class = VaccinePreAlertSerializer


class VaccineArrivalReportViewSet(ModelViewSet):
    queryset = VaccineArrivalReport.objects.all()
    serializer_class = VaccineArrivalReportSerializer
