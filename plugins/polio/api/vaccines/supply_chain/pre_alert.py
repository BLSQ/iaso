from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, serializers

from iaso.api.common import ModelViewSet
from plugins.polio.api.vaccines.supply_chain.shared import VaccineSupplyChainReadWritePerm
from plugins.polio.models import VaccinePreAlert


class VaccinePreAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccinePreAlert
        fields = "__all__"


class VaccinePreAlertViewSet(ModelViewSet):
    permission_classes = [VaccineSupplyChainReadWritePerm]
    serializer_class = VaccinePreAlertSerializer
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]

    def get_queryset(self):
        return VaccinePreAlert.objects.filter(request_form__campaign__account=self.request.user.iaso_profile.account)
