from rest_framework import permissions, serializers

from iaso.api.common import EtlModelViewset
from iaso.api.serializers import OrgUnitSerializer
from plugins.polio.models import OrgUnit
from plugins.polio.models.base import SubActivity, SubActivityScope


class SubActivityDashboardSerializer(serializers.ModelSerializer):
    obr_name = serializers.CharField(source="round.campaign.obr_name")
    round_number = serializers.CharField(source="round.number")

    class Meta:
        model = SubActivity
        fields = "__all__"


class SubActivityDashboardViewSet(EtlModelViewset):
    """
    GET /api/polio/dashboards/subactivities/
    Returns all subactivities for the user's account, excluding those related to deleted campaig ns
    Simple endpoint that returns all model fields to facilitate data manipulation by OpenHexa or PowerBI
    """

    http_method_names = ["get"]
    permission_classes = [permissions.IsAuthenticated]
    model = SubActivity
    serializer_class = SubActivityDashboardSerializer

    def get_queryset(self):
        return SubActivity.objects.filter(
            round__campaign__account=self.request.user.iaso_profile.account, round__campaign__deleted_at__isnull=True
        )


class OrgUnitNestedSerializer(OrgUnitSerializer):
    class Meta:
        model = OrgUnit
        fields = [
            "id",
            "name",
        ]


class SubActivityScopeDashboardSerializer(serializers.ModelSerializer):
    obr_name = serializers.CharField(source="subactivity.round.campaign.obr_name")
    round_number = serializers.IntegerField(source="subactivity.round.number")
    subactivity_name = serializers.CharField(source="subactivity.name")
    org_units = OrgUnitNestedSerializer(source="group.org_units", many=True)

    class Meta:
        model = SubActivityScope
        fields = "__all__"


class SubActivityScopeDashboardViewSet(EtlModelViewset):
    """
    GET /api/polio/dashboards/subactivityscopes/
    Returns all subactivityscopes for the user's account, excluding those related to deleted campaigns
    Simple endpoint that returns all model fields to facilitate data manipulation by OpenHexa or PowerBI
    """

    http_method_names = ["get"]
    permission_classes = [permissions.IsAuthenticated]
    model = SubActivityScope
    serializer_class = SubActivityScopeDashboardSerializer

    def get_queryset(self):
        return SubActivityScope.objects.filter(
            subactivity__round__campaign__account=self.request.user.iaso_profile.account,
            subactivity__round__campaign__deleted_at__isnull=True,
        )
