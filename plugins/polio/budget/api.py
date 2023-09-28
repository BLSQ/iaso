from typing import Type
from django.db.models import QuerySet, Max
from django.http import HttpResponse
from django.shortcuts import redirect
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from iaso.api.common import CSVExportMixin, ModelViewSet, DeletionFilterBackend, HasPermission, Paginator
from plugins.polio.budget.models import BudgetStep, MailTemplate, get_workflow, BudgetStepFile, BudgetProcess
from plugins.polio.budget.serializers import (
    CampaignBudgetSerializer,
    ExportCampaignBudgetSerializer,
    TransitionToSerializer,
    BudgetStepSerializer,
    UpdateBudgetStepSerializer,
    WorkflowSerializer,
    TransitionOverrideSerializer,
    BudgetProcessSerializer,
)
from iaso.api.common import CustomFilterBackend
from plugins.polio.models import Campaign
from hat.menupermissions import models as permission


# FIXME maybe: Maybe we should inherit from CampaignViewSet directly to not duplicate all the order and filter logic
# But then we would inherit all the other actions too
@swagger_auto_schema(tags=["budget"])
class BudgetCampaignViewSet(ModelViewSet, CSVExportMixin):
    """
    Campaign endpoint with budget information.
    You can request specific field by using the ?fields parameter
    """

    serializer_class = CampaignBudgetSerializer
    exporter_serializer_class = ExportCampaignBudgetSerializer
    export_filename = "campaigns_budget_list_{date}.csv"
    permission_classes = [HasPermission(permission.POLIO_BUDGET)]  # type: ignore
    use_field_order = True
    # Make this read only
    # FIXME : remove POST
    http_method_names = ["get", "head", "post"]
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        DeletionFilterBackend,
        CustomFilterBackend,
    ]

    def get_queryset(self) -> QuerySet:
        user = self.request.user
        campaigns = Campaign.objects.filter_for_user(user)
        campaigns = campaigns.annotate(budget_last_updated_at=Max("budget_steps__created_at"))
        return campaigns

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        org_unit_groups = self.request.query_params.get("orgUnitGroups")
        if org_unit_groups:
            queryset = queryset.filter(country__groups__in=org_unit_groups.split(","))
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
        "budget_current_state_key",
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
        "budget_current_state_key": ["exact", "in"],
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

    @action(
        detail=False,
        methods=["POST"],
        serializer_class=TransitionOverrideSerializer,
        permission_classes=[HasPermission("iaso_polio_budget_admin")],
    )
    def override(self, request):
        "Transition campaign to next state. Use multipart/form-data to send files"
        """Transition campaign to next state. Use multipart/form-data to send files"""
        data = request.data
        serializer = TransitionOverrideSerializer(data=data, context={"request": request})
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
    ordering = "-created_at"

    def get_serializer_class(self) -> Type[serializers.BaseSerializer]:
        if self.request.method == "patch":
            return UpdateBudgetStepSerializer
        return BudgetStepSerializer

    permission_classes = [HasPermission(permission.POLIO_BUDGET)]  # type: ignore
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
        "transition_key": ["exact", "in"],
    }

    @action(detail=True, methods=["GET"], url_path="files/(?P<file_pk>[0-9]+)")
    def files(self, request, pk, file_pk):
        "Redirect to the static file"
        # Since on AWS S3 the signed url created (for the media upload files) are only valid a certain amount of time
        # This is endpoint is used to give a permanent url to the users.
        # Use the queryset to ensure the user has the proper access rights to this step
        # and keep down the url guessing.
        step: BudgetStep = self.get_queryset().get(pk=pk)
        stepFile: BudgetStepFile = get_object_or_404(step.files, pk=file_pk)
        url = stepFile.file.url
        return redirect(url, permanent=False)

    @action(detail=True, permission_classes=[permissions.IsAdminUser])
    def mail_template(self, request, pk):
        step = self.get_queryset().get(pk=pk)
        template_id = request.query_params.get("template_id")
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


# noinspection PyMethodMayBeStatic
@swagger_auto_schema(tags=["budget"])
class WorkflowViewSet(ViewSet):
    """
    Info on the budge workflow
    This endpoint is currently used to show the possible state in the filter
    """

    permission_classes = [HasPermission(permission.POLIO_BUDGET)]  # type: ignore

    # At the moment I only implemented retrieve /current hardcode because we only support one workflow at the time
    # to keep the design simple, change if/when we want to support multiple workflow.
    def retrieve(self, request, pk="current"):
        try:
            workflow = get_workflow()
        except Exception as e:
            return Response({"error": "Error getting workflow", "details": str(e)})
        return Response(WorkflowSerializer(workflow).data)


@swagger_auto_schema(tags=["budget_process"])
class BudgetProcessViewset(ModelViewSet):
    """
    Endpoint that allows to handle multiples rounds per Budget.
    """

    permission_classes = [HasPermission(permission.POLIO_BUDGET)]  # type: ignore
    serializer_class = BudgetProcessSerializer
    http_method_names = ["get", "head", "delete", "patch", "post"]
    ordering_fields = ["created_at", "updated_at", "rounds", "teams"]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, DeletionFilterBackend]
    results_key = "results"
    remove_results_key_if_paginated = True
    pagination_class = Paginator

    def get_queryset(self):
        queryset = BudgetProcess.objects.filter(teams__users=self.request.user)

        return queryset
