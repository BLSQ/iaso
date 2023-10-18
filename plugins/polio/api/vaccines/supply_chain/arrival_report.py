from rest_framework import serializers

from iaso.api.common import ModelViewSet
from plugins.polio.api.vaccines.supply_chain.shared import VaccineSupplyChainReadWritePerm
from plugins.polio.models import VaccineArrivalReport


class VaccineArrivalReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccineArrivalReport
        fields = "__all__"


class VaccineArrivalReportViewSet(ModelViewSet):
    permission_classes = [VaccineSupplyChainReadWritePerm]
    serializer_class = VaccineArrivalReportSerializer

    def get_queryset(self):
        return VaccineArrivalReport.objects.filter(
            request_form__campaign__account=self.request.user.iaso_profile.account
        )
