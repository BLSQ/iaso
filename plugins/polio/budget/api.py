from typing import Type

from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import QuerySet, F, Q
from django.http import HttpResponse
from django.shortcuts import redirect
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from hat.menupermissions import models as permission
from iaso.api.common import CSVExportMixin, ModelViewSet, DeletionFilterBackend, HasPermission
from plugins.polio.budget.filters import BudgetCampaignFilter
from plugins.polio.budget.models import BudgetStep, MailTemplate, get_workflow, BudgetStepFile, BudgetProcess
from plugins.polio.budget.serializers import (
    BudgetProcessSerializer,
    BudgetProcessWriteSerializer,
    BudgetStepSerializer,
    ExportBudgetProcessSerializer,
    TransitionOverrideSerializer,
    TransitionToSerializer,
    UpdateBudgetStepSerializer,
    WorkflowSerializer,
    AvailableRoundsSerializer,
)
from plugins.polio.models import Campaign, Round


@swagger_auto_schema(tags=["budget"])
class BudgetCampaignViewSet(ModelViewSet, CSVExportMixin):
    """
    Budget information endpoint.

    You can request specific field by using the `?fields` parameter.
    """

    exporter_serializer_class = ExportBudgetProcessSerializer
    export_filename = "campaigns_budget_list_{date}.csv"
    permission_classes = [HasPermission(permission.POLIO_BUDGET)]  # type: ignore
    use_field_order = True
    http_method_names = ["delete", "get", "head", "post"]
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        DeletionFilterBackend,
    ]
    filterset_class = BudgetCampaignFilter

    def get_serializer_class(self):
        if self.action == "create":
            return BudgetProcessWriteSerializer
        return BudgetProcessSerializer

    def destroy(self, request, *args, **kwargs):
        """
        Soft deletion will break integrity, making it hard to find the previous
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
        campaigns = Campaign.objects.filter_for_user(user)
        budget_processes = (
            BudgetProcess.objects.filter(rounds__campaign__in=campaigns)
            .distinct()
            .annotate(
                campaign_id=F("rounds__campaign_id"),
                obr_name=F("rounds__campaign__obr_name"),
                country_name=F("rounds__campaign__country__name"),
                round_numbers=ArrayAgg("rounds__number", ordering="rounds__number"),
            )
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
    def available_rounds(self, request):
        """
        Returns available rounds that can be associated with a given `budget_process_id`.
        `campaign_id` is required too to make queries and validation easier.

        Used in the UI to build a select dropdown when editing a budget process.
        """
        input = AvailableRoundsSerializer(data=request.query_params)
        input.is_valid(raise_exception=True)
        campaign_uuid = input.validated_data["campaign_id"]
        budget_process_id = input.validated_data["budget_process_id"]

        campaign = Campaign.objects.filter(id=campaign_uuid).filter_for_user(self.request.user).first()

        available_rounds = (
            Round.objects.filter(campaign=campaign)
            .filter(Q(budget_process_id=budget_process_id) | Q(budget_process__isnull=True))
            .order_by("number")
            .only("id", "number")
        )

        result = [{"value": rnd.id, "label": rnd.number, "campaign_id": campaign_uuid} for rnd in available_rounds]
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=["GET"])
    def available_rounds_dropdowns(self, request):
        """
        Returns all available rounds.
        Used in the UI to build dependent select dropdowns when creating a new budget process.

        Returns this data structure.

            {
                "countries": [
                    {"value": 1, "label": "Niger"}
                ],
                "campaigns": [
                    {"value": "e5a1209b-8881-4b66-82a0-429a53dbc94b", "label": "nopv2", "country_id": 1}
                ],
                "rounds": [
                    {"value": 1, "label": 1, "campaign_id": "e5a1209b-8881-4b66-82a0-429a53dbc94b"}
                ]
            }

        """
        user_campaigns = Campaign.objects.filter_for_user(self.request.user).filter(country__isnull=False)
        available_rounds = (
            Round.objects.filter(budget_process__isnull=True, campaign__in=user_campaigns)
            .select_related("campaign__country")
            .order_by("campaign__country__name", "campaign__obr_name", "number")
            .only(
                "id", "number", "campaign_id", "campaign__obr_name", "campaign__country_id", "campaign__country__name"
            )
        )

        data = {"unique_countries": {}, "unique_campaigns": {}, "rounds": []}
        for rnd in available_rounds:
            campaign_uuid = str(rnd.campaign_id)
            data["unique_countries"].setdefault(
                rnd.campaign.country_id,
                {"value": rnd.campaign.country_id, "label": rnd.campaign.country.name},
            )
            data["unique_campaigns"].setdefault(
                campaign_uuid,
                {"value": campaign_uuid, "label": rnd.campaign.obr_name, "country_id": rnd.campaign.country_id},
            )
            data["rounds"].append({"value": rnd.id, "label": rnd.number, "campaign_id": campaign_uuid})

        return Response(
            {
                "countries": data["unique_countries"].values(),
                "campaigns": data["unique_campaigns"].values(),
                "rounds": data["rounds"],
            },
            status=status.HTTP_200_OK,
        )


@swagger_auto_schema(tags=["budget"])
class BudgetStepViewSet(ModelViewSet):
    """
    Steps on a budget process, to progress the budget workflow.
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
