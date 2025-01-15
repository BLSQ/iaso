from rest_framework import permissions, serializers

from hat.menupermissions import models as permission
from iaso.api.common import EtlModelViewset, HasPermission
from plugins.polio.budget.models import BudgetProcess
from plugins.polio.models import Round


class RoundsNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = [
            "id",
            "number",
        ]


class BudgetDashboardSerializer(serializers.ModelSerializer):
    obr_name = serializers.SerializerMethodField()
    rounds = RoundsNestedSerializer(many=True)

    class Meta:
        model = BudgetProcess
        fields = "__all__"

    def get_obr_name(self, budget):
        filtered_queryset = budget.rounds.filter(campaign__deleted_at__isnull=True, campaign__isnull=False)
        if not filtered_queryset:
            return ""

        return filtered_queryset.first().campaign.obr_name


class BudgetDashboardViewSet(EtlModelViewset):
    """
    GET /api/polio/dashboards/budgets/
    Returns all BudgetProcesses for the user's account, excluding those related to deleted campaigns
    Simple endpoint that returns all model fields to facilitate data manipulation by OpenHexa or PowerBI
    """

    http_method_names = ["get"]
    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.POLIO_BUDGET)]
    model = BudgetProcess
    serializer_class = BudgetDashboardSerializer

    def get_queryset(self):
        return (
            BudgetProcess.objects.filter(
                deleted_at__isnull=True,
                rounds__campaign__deleted_at__isnull=True,
                rounds__campaign__account=self.request.user.iaso_profile.account,
            )
            .prefetch_related("rounds", "rounds__campaign")
            .distinct()
            .order_by("id")
        )
