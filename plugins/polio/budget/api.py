from typing import Type

from django.db.models import QuerySet, Max
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.common import ModelViewSet, DeletionFilterBackend
from plugins.polio.budget.models import BudgetStep, MailTemplate
from plugins.polio.budget.serializers import (
    CampaignBudgetSerializer,
    TransitionToSerializer,
    BudgetStepSerializer,
    UpdateBudgetStepSerializer,
)
from plugins.polio.models import Campaign


# FIXME maybe: Maybe we should inherit from CampaignViewSet directly to not duplicate all the order and filter logic
# But then we would inherit all the other actions too
@swagger_auto_schema(tags=["budget"])
class BudgetCampaignViewSet(ModelViewSet):
    """
    Campaign endpoint with budget information.

    You can request specific field by using the ?fields paramter
    """

    serializer_class = CampaignBudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Make this read only
    # FIXME : remove POST
    http_method_names = ["get", "head", "post"]
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        DeletionFilterBackend,
    ]

    def get_queryset(self) -> QuerySet:
        # Fixme refactor in function
        user = self.request.user
        campaigns = Campaign.objects.filter_for_user(user)
        campaigns = campaigns.annotate(budget_last_updated_at=Max("budget_steps__created_at"))
        return campaigns

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

    @action(detail=False, methods=["POST"], serializer_class=TransitionToSerializer)
    def transition_to(self, request):
        "Transition campaign to next state. Use multipart/form-data to send files"
        # data = request.data.dict()
        # data['links'] = request.data.getlist('links')
        data = request.data
        serializer = TransitionToSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        budget_step = serializer.save()

        return Response({"result": "success", "id": budget_step.id}, status=status.HTTP_201_CREATED)


@swagger_auto_schema(tags=["budget"])
class BudgetStepViewSet(ModelViewSet):
    """
    Step on a campaign, to progress the budget workflow
    """

    # FIXME : add DELETE
    # filter perms on campaign

    def get_serializer_class(self) -> Type[serializers.BaseSerializer]:
        if self.request.method == "patch":
            return UpdateBudgetStepSerializer
        return BudgetStepSerializer

    permission_classes = [permissions.IsAuthenticated]

    http_method_names = ["get", "head", "delete", "patch"]
    filter_backends = [
        filters.OrderingFilter,
        DeletionFilterBackend,
        DjangoFilterBackend,
    ]

    def get_queryset(self) -> QuerySet:
        return BudgetStep.objects.filter_for_user(self.request.user)

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        return queryset

    ordering_fields = [
        "campaign_id",
        "created_at",
        "created_by",
    ]
    filterset_fields = {
        "campaign_id": ["exact"],
    }

    @action(detail=True, permission_classes=[permissions.IsAdminUser])
    def mail_template(self, request, pk):
        step = self.get_queryset().get(pk=pk)
        template_id = request.query_params.get("template_id")
        print(template_id)
        template = MailTemplate.objects.get(id=template_id)
        email_template = template.render_for_step(step, request.user, request)
        format = request.query_params.get("as", "all")
        if format == "html":
            html = email_template.alternatives[0][0]
        elif format == "txt":
            html = email_template.body
        elif format == "subject":
            html = email_template.subject
        else:
            html = email_template.message().as_string()

        return HttpResponse(html)
