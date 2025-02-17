from typing import Type

from django.db.models import F, Q, QuerySet
from django.http import HttpResponse
from django.shortcuts import redirect
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from hat.menupermissions import models as permission
from iaso.api.common import (
    CSVExportMixin,
    DeletionFilterBackend,
    HasPermission,
    ModelViewSet,
)
from plugins.polio.budget.filters import BudgetProcessFilter
from plugins.polio.budget.models import (
    BudgetProcess,
    BudgetStep,
    BudgetStepFile,
    MailTemplate,
    get_workflow,
)
from plugins.polio.budget.serializers import (
    AvailableRoundsSerializer,
    BudgetProcessSerializer,
    BudgetProcessWriteSerializer,
    BudgetStepSerializer,
    ExportBudgetProcessSerializer,
    TransitionOverrideSerializer,
    TransitionToSerializer,
    UpdateBudgetStepSerializer,
    WorkflowSerializer,
)
from plugins.polio.models import Campaign, Round


@swagger_auto_schema(tags=["budget"])
class BudgetProcessViewSet(ModelViewSet, CSVExportMixin):
    """
    Budget information endpoint.

    You can request specific field by using the `?fields` parameter.
    """

    exporter_serializer_class = ExportBudgetProcessSerializer
    export_filename = "campaigns_budget_list_{date}.csv"
    permission_classes = [HasPermission(permission.POLIO_BUDGET)]  # type: ignore
    use_field_order = True
    http_method_names = ["delete", "get", "head", "patch", "post"]
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        DeletionFilterBackend,
    ]
    filterset_class = BudgetProcessFilter
    ordering_fields = [
        "current_state_key",
        "obr_name",
        "country_name",
        "updated_at",
    ]

    def get_serializer_class(self):
        if self.action in ["partial_update", "create"]:
            return BudgetProcessWriteSerializer
        return BudgetProcessSerializer

    def destroy(self, request, *args, **kwargs):
        """
        Soft deletion will break integrity: it will be hard to find the previous
        `Rounds` linked to a `BudgetProcess`.
        If a user wants to restore a soft deleted `BudgetProcess`, the burden
        of finding the previous linked `Rounds` will be left on his own.
        """
        # Soft delete `BudgetProcess`.
        budget_process = self.get_object()
        self.perform_destroy(budget_process)
        # Soft delete `BudgetStep`s.
        budget_process.budget_steps.all().delete()
        # Reset `Rounds`s FKs so that they can be linked to a new `BudgetProcess`.
        budget_process.rounds.update(budget_process=None)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_queryset(self) -> QuerySet:
        user = self.request.user
        campaigns = Campaign.polio_objects.filter_for_user(user)
        budget_processes = (
            BudgetProcess.objects.filter(rounds__campaign__in=campaigns)
            .distinct()
            .annotate(
                campaign_id=F("rounds__campaign_id"),
                obr_name=F("rounds__campaign__obr_name"),
                country_name=F("rounds__campaign__country__name"),
            )
            .prefetch_related("rounds")
        )
        return budget_processes

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

    @action(detail=False, methods=["GET"])
    def available_rounds_for_create(self, request):
        """
        Returns all available rounds that can be used to create a new `BudgetProcess`.
        """
        user_campaigns = Campaign.polio_objects.filter_for_user(request.user).filter(country__isnull=False)

        available_rounds = (
            Round.objects.filter(
                budget_process__isnull=True,
                campaign__in=list(user_campaigns),
            )
            .select_related("campaign__country")
            .order_by("campaign__country__name", "campaign__obr_name", "number")
            .only(
                "id",
                "number",
                "campaign_id",
                "campaign__obr_name",
                "campaign__country_id",
                "campaign__country__name",
                "target_population",
            )
        )
        return Response(available_rounds.as_ui_dropdown_data(), status=status.HTTP_200_OK)

    @action(detail=False, methods=["GET"])
    def available_rounds_for_update(self, request):
        """
        Returns rounds that can be associated to a given `BudgetProcess`.
        """
        query_params = AvailableRoundsSerializer(data=request.query_params)
        query_params.is_valid(raise_exception=True)
        campaign_uuid = query_params.validated_data["campaign_id"]
        budget_process_id = query_params.validated_data["budget_process_id"]

        campaign = Campaign.polio_objects.filter(id=campaign_uuid).filter_for_user(self.request.user).first()
        available_rounds = (
            Round.objects.filter(campaign=campaign)
            .select_related("campaign__country")
            .filter(Q(budget_process_id=budget_process_id) | Q(budget_process__isnull=True))
            .order_by("number")
            .only(
                "id",
                "number",
                "campaign_id",
                "campaign__obr_name",
                "campaign__country_id",
                "campaign__country__name",
                "target_population",
            )
        )
        return Response(available_rounds.as_ui_dropdown_data()["rounds"], status=status.HTTP_200_OK)


@swagger_auto_schema(tags=["budget"])
class BudgetStepViewSet(ModelViewSet):
    """
    Step on a budget process, to progress the budget workflow.
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

    ordering_fields = [
        "budget_process_id",
        "created_at",
        "created_by",
    ]
    filterset_fields = {
        "budget_process_id": ["exact"],
        "transition_key": ["exact", "in"],
    }

    @action(detail=True, methods=["GET"], url_path="files/(?P<file_pk>[0-9]+)")
    def files(self, request, pk, file_pk):
        """
        Redirect to the static file.
        """
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
        step: BudgetStep = (
            self.get_queryset().select_related("budget_process", "campaign").prefetch_related("rounds").get(pk=pk)
        )
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
