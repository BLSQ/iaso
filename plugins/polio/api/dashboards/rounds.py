from drf_spectacular.utils import extend_schema
from rest_framework import serializers

from iaso.api.common import ModelViewSet
from plugins.polio.api.permission_classes import PolioReadPermission
from plugins.polio.models import Round


class RoundDashboardSerializer(serializers.ModelSerializer):
    obr_name = serializers.CharField(source="campaign.obr_name")

    class Meta:
        model = Round
        exclude = ["preparedness_spreadsheet_url"]


@extend_schema(tags=["Polio - Dashboards - Rounds"])
class RoundDashboardViewSet(ModelViewSet):
    http_method_names = ["get"]
    permission_classes = [PolioReadPermission]
    model = Round
    serializer_class = RoundDashboardSerializer

    def get_queryset(self):
        return Round.objects.filter(campaign__account=self.request.user.iaso_profile.account).select_related("campaign")
