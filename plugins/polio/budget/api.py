from django.db.models import QuerySet
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.common import ModelViewSet, DeletionFilterBackend
from iaso.models import OrgUnit
from plugins.polio.budget.serializers import CampaignBudgetSerializer, TransitionToSerializer
from plugins.polio.models import Campaign


# FIXME maybe: Maybe we should inherit from CampaignViewSet directly to not duplicate all the order and filter logic
# But then we would inherit all the other actions too
@swagger_auto_schema(tags=["budget"])
class BudgetCampaignViewSet(ModelViewSet):
    """
    Campaign endpoint with budget information
    """

    serializer_class = CampaignBudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Make this read only
    # FIXME : rmeove POST
    http_method_names = ["get", "head", "post"]
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        DeletionFilterBackend,
    ]

    def get_queryset(self) -> QuerySet:
        # Fixme refactor in function
        user = self.request.user
        campaigns = Campaign.objects.all()
        if user.is_authenticated and user.iaso_profile.org_units.count():
            org_units = OrgUnit.objects.hierarchy(user.iaso_profile.org_units.all())
            return campaigns.filter(initial_org_unit__in=org_units)
        else:
            return campaigns.filter()

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        return queryset

    ordering_fields = [
        "obr_name",
        "cvdpv2_notified_at",
        "detection_status",
        "first_round_started_at",
        "last_round_started_at",
        "country__name",
        "last_budget_event__created_at",
        "last_budget_event__type",
        "last_budget_event__status",
    ]
    filterset_fields = {
        "last_budget_event__status": ["exact"],
        "country__name": ["exact"],
        "country__id": ["in"],
        "grouped_campaigns__id": ["in", "exact"],
        "obr_name": ["exact", "contains"],
        "cvdpv2_notified_at": ["gte", "lte", "range"],
        "created_at": ["gte", "lte", "range"],
        "rounds__started_at": ["gte", "lte", "range"],
    }

    @action(detail=False, methods=["POST", "GET"], serializer_class=TransitionToSerializer)
    def transition_to(self, request):
        serializer = TransitionToSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        budget_step = serializer.save()

        return Response({"result": "success", "id": budget_step.id}, status=status.HTTP_201_CREATED)
