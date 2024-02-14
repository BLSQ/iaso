from rest_framework import serializers, permissions
from iaso.api.common import ModelViewSet
from plugins.polio.models import Round


class RoundDashboardSerializer(serializers.ModelSerializer):
    obr_name = serializers.CharField(source="campaign.obr_name")

    class Meta:
        model = Round
        fields = "__all__"


class RoundDashboardViewSet(ModelViewSet):
    http_method_names = ["get"]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    model = Round
    serializer_class = RoundDashboardSerializer

    def get_queryset(self):
        return Round.objects.filter(campaign__account=self.request.user.iaso_profile.account).select_related("campaign")
