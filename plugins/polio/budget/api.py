from typing import Type
from django.db.models import QuerySet, F
from django.contrib.postgres.aggregates import ArrayAgg
from django.http import HttpResponse
from django.shortcuts import redirect
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from iaso.api.common import CSVExportMixin, ModelViewSet, DeletionFilterBackend, HasPermission
from plugins.polio.budget.models import BudgetStep, MailTemplate, get_workflow, BudgetStepFile, BudgetProcess
from plugins.polio.budget.serializers import (
    BudgetProcessSerializer,
    ExportBudgetProcessSerializer,
    TransitionToSerializer,
    BudgetStepSerializer,
    UpdateBudgetStepSerializer,
    WorkflowSerializer,
    TransitionOverrideSerializer,
)
from iaso.api.common import CustomFilterBackend
from plugins.polio.models import Campaign, Round
from hat.menupermissions import models as permission


@swagger_auto_schema(tags=["budget"])
class BudgetCampaignViewSet(ModelViewSet, CSVExportMixin):
    """
    Budget information endpoint.

    You can request specific field by using the `?fields` parameter.
    """

    serializer_class = BudgetProcessSerializer
    exporter_serializer_class = ExportBudgetProcessSerializer
    export_filename = "campaigns_budget_list_{date}.csv"
    permission_classes = [HasPermission(permission.POLIO_BUDGET)]  # type: ignore
    use_field_order = True

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
        budget_processes = (
            BudgetProcess.objects.filter(rounds__campaign__in=campaigns)
            .distinct()
            .annotate(
                obr_name=F("rounds__campaign__obr_name"),
                country_name=F("rounds__campaign__country__name"),
                round_numbers=ArrayAgg("rounds__number"),
            )
        )
        return budget_processes

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)

        org_unit_groups = self.request.query_params.get("orgUnitGroups")
        if org_unit_groups:
            queryset = queryset.filter(country__groups__in=org_unit_groups.split(","))

        return queryset

    @action(detail=False, methods=["POST"], serializer_class=TransitionToSerializer)
    def transition_to(self, request):
        """
        Transition `BudgetProcess` to next state. Use multipart/form-data to send files.
        """
        data = request.data
        serializer = TransitionToSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        budget_step = serializer.save()

        return Response({"result": "success", "id": budget_step.id}, status=status.HTTP_201_CREATED)

    @action(
        detail=False,
        methods=["POST"],
        serializer_class=TransitionOverrideSerializer,
        permission_classes=[HasPermission(permission.POLIO_BUDGET_ADMIN)],
    )
    def override(self, request):
        """
        Override `BudgetProcess` state.
        """
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
