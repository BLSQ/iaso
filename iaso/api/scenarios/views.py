import copy

from django.db.models import Exists, OuterRef, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import filters, mixins, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from hat.audit.models import SCENARIO_API, log_modification
from iaso.api.common.mixin import CustomPaginationListModelMixin
from iaso.api.scenarios.filters import ScenarioFilter
from iaso.api.scenarios.permissions import HasScenarioPermission
from iaso.api.scenarios.serializers import (
    EditorFormsSerializer,
    ScenarioDetailSerializer,
    ScenarioFormsQuerySerializer,
    ScenarioListSerializer,
    ScenarioOutcomeSerializer,
    ScenarioPreviewRequestSerializer,
    ScenarioRunRequestSerializer,
    ScenarioRunResponseSerializer,
    ScenarioStepPrepareResponseSerializer,
    ScenarioStepPrepareSerializer,
    ScenarioWriteSerializer,
)
from iaso.models import Scenario, WorkflowChange, WorkflowFollowup
from iaso.scenarios.forms import FormSource, account_forms
from iaso.scenarios.runs import FormNotFound, prepare_step, run_scenarios, save_last_runs
from iaso.scenarios.schema import json_schema


@extend_schema(tags=["Scenarios"])
class ScenarioViewSet(
    CustomPaginationListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    """Scenarios: workflow and form test files, imported or written in the scenario editor, run on demand against a
    workflow version - nothing is saved but the last result. PATCH replaces a scenario's file (`definition`)."""

    permission_classes = [HasScenarioPermission]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    filterset_class = ScenarioFilter
    ordering_fields = ["id", "name", "created_at", "updated_at", "last_run_at"]
    ordering = ["name", "id"]
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        queryset = Scenario.objects.filter(account=self.request.user.iaso_profile.account)
        if self.action == "retrieve":
            queryset = queryset.select_related("entity_type")
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.action in ("list", "retrieve") and getattr(self.request.user, "iaso_profile", None):
            # the journey by form names: one query for all the scenarios
            forms = account_forms(self.request.user.iaso_profile.account).values_list("form_id", "name")
            context["form_names"] = dict(forms)
        return context

    def get_serializer_class(self):
        if self.action == "list":
            return ScenarioListSerializer
        if self.action in ("create", "partial_update"):
            return ScenarioWriteSerializer
        if self.action == "run":
            return ScenarioRunRequestSerializer
        if self.action == "preview":
            return ScenarioPreviewRequestSerializer
        if self.action == "prepare_step":
            return ScenarioStepPrepareSerializer
        if self.action == "forms":
            return ScenarioFormsQuerySerializer
        return ScenarioDetailSerializer

    @extend_schema(responses={201: ScenarioDetailSerializer})
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        scenario = serializer.save()
        log_modification(None, scenario, SCENARIO_API, user=request.user)
        return Response(ScenarioDetailSerializer(scenario).data, status=status.HTTP_201_CREATED)

    @extend_schema(request=ScenarioWriteSerializer, responses={200: ScenarioDetailSerializer})
    def partial_update(self, request, *args, **kwargs):
        scenario = self.get_object()
        before = copy.deepcopy(scenario)
        serializer = self.get_serializer(scenario, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        scenario = serializer.save()
        log_modification(before, scenario, SCENARIO_API, user=request.user)
        return Response(ScenarioDetailSerializer(scenario).data)

    def perform_destroy(self, instance: Scenario):
        before = copy.deepcopy(instance)
        instance.updated_by = self.request.user
        instance.delete()
        log_modification(before, instance, SCENARIO_API, user=self.request.user)

    @extend_schema(
        request=ScenarioRunRequestSerializer,
        responses={200: ScenarioRunResponseSerializer, 400: OpenApiTypes.OBJECT, 403: OpenApiTypes.OBJECT},
    )
    @action(detail=False, methods=["post"], filter_backends=[], pagination_class=None)
    def run(self, request):
        """Runs the scenarios now, and keeps the result on each: `{"results": [...]}`, in the order asked."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        now = timezone.now()
        outcomes = run_scenarios(
            serializer.validated_data["scenario_ids"], serializer.validated_data.get("workflow_version"), now=now
        )
        results = ScenarioOutcomeSerializer(outcomes, many=True).data
        save_last_runs(outcomes, results, now)
        return Response({"results": results})

    @extend_schema(
        request=ScenarioPreviewRequestSerializer,
        responses={200: ScenarioOutcomeSerializer, 400: OpenApiTypes.OBJECT, 403: OpenApiTypes.OBJECT},
    )
    @action(detail=False, methods=["post"], filter_backends=[], pagination_class=None)
    def preview(self, request):
        """Runs a scenario file being written (the scenario editor), saving nothing: the result of each step."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        scenario = serializer.validated_data["scenario"]
        [outcome] = run_scenarios([scenario], serializer.validated_data.get("workflow_version"))
        return Response(ScenarioOutcomeSerializer(outcome).data)

    @extend_schema(
        request=ScenarioStepPrepareSerializer,
        responses={200: ScenarioStepPrepareResponseSerializer, 400: OpenApiTypes.OBJECT, 403: OpenApiTypes.OBJECT},
    )
    @action(detail=False, methods=["post"], filter_backends=[], pagination_class=None)
    def prepare_step(self, request):
        """The next step of a scenario being written: its form prefilled from the entity's information after the
        steps before it (replayed, nothing saved), to fill in web-forms; and the forms the app offers at that point."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        scenario = data["scenario"]
        try:
            step = prepare_step(
                scenario,
                data.get("form"),
                data.get("answers", {}),
                data.get("context", {}),
                data.get("workflow_version"),
            )
        except FormNotFound as e:
            raise ValidationError({"form": [str(e)]})
        return Response(ScenarioStepPrepareResponseSerializer(step).data)

    @extend_schema(parameters=[ScenarioFormsQuerySerializer], responses={200: EditorFormsSerializer})
    @action(detail=False, methods=["get"], filter_backends=[], pagination_class=None)
    def forms(self, request):
        """The forms a scenario of the entity type can fill - its reference form, the forms of its workflow's
        follow-ups and copy rules - with the questions to answer."""
        serializer = self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        entity_type = serializer.validated_data["entity_type"]
        account = request.user.iaso_profile.account
        workflow_forms = account_forms(account).filter(
            Q(id=entity_type.reference_form_id)
            | Exists(
                WorkflowFollowup.objects.filter(
                    forms=OuterRef("pk"), workflow_version__workflow__entity_type=entity_type
                )
            )
            | Exists(
                WorkflowChange.objects.filter(form=OuterRef("pk"), workflow_version__workflow__entity_type=entity_type)
            )
        )
        source = FormSource(account)
        results = []
        for form in workflow_forms.order_by("name", "id"):
            editor_form = source.editor_form(form.form_id)
            if editor_form is not None:
                results.append({**editor_form, "id": form.id, "is_reference": form.id == entity_type.reference_form_id})
        results.sort(key=lambda editor_form: not editor_form["is_reference"])
        return Response({"results": results})

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    @action(detail=False, methods=["get"], url_path="schema", filter_backends=[], pagination_class=None)
    def file_schema(self, request):
        """The JSON Schema of a scenario file, for editors (`"$schema"`)."""
        return Response(json_schema())
