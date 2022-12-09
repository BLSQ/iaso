from copy import deepcopy

from iaso.models import Workflow, WorkflowVersion, EntityType, WorkflowFollowup, WorkflowChange, Form
from iaso.models.workflow import WorkflowVersionsStatus


from rest_framework import serializers, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore

from iaso.api.common import ModelViewSet, HasPermission

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema, no_body

from django.shortcuts import get_object_or_404


class FormMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = ["id", "name"]


class EntityTypeMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityType
        fields = ["id", "name", "reference_form"]


class WorkflowVersionSerializer(serializers.ModelSerializer):
    version_id = serializers.IntegerField(source="pk")

    class Meta:
        model = WorkflowVersion

        fields = ["status", "created_at", "updated_at", "version_id", "name"]


class WorkflowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workflow

        fields = [
            "entity_type_id",
            "created_at",
            "updated_at",
        ]


class WorkflowChangeSerializer(serializers.ModelSerializer):
    form = FormMiniSerializer(many=False)

    class Meta:
        model = WorkflowChange
        fields = ["form", "mapping", "created_at", "updated_at"]


class WorkflowFollowupSerializer(serializers.ModelSerializer):
    forms = FormMiniSerializer(many=True)

    class Meta:
        model = WorkflowFollowup
        fields = ["id", "order", "condition", "forms", "created_at", "updated_at"]


class WorkflowVersionDetailSerializer(serializers.ModelSerializer):
    version_id = serializers.IntegerField(source="pk")
    reference_form = FormMiniSerializer()
    entity_type = EntityTypeMiniSerializer(source="workflow.entity_type")
    changes = WorkflowChangeSerializer(many=True)
    follow_ups = WorkflowFollowupSerializer(many=True)

    class Meta:
        model = WorkflowVersion

        fields = [
            "version_id",
            "status",
            "name",
            "entity_type",
            "reference_form",
            "created_at",
            "updated_at",
            "changes",
            "follow_ups",
        ]


def clone_change(new_version):
    def clone_change_real(orig_change):
        new_change = deepcopy(orig_change)
        new_change.workflow_version = new_version
        new_change.id = None
        new_change.save()

        return new_change

    return clone_change_real


def clone_followup(new_version):
    def clone_followup_real(orig_followup):
        new_followup = deepcopy(orig_followup)
        new_followup.workflow_version = new_version
        new_followup.id = None
        new_followup.save()

        return new_followup

    return clone_followup_real


def make_deep_copy_with_relations(orig_version):
    orig_changes = WorkflowChange.objects.filter(workflow_version=orig_version)
    orig_follow_ups = WorkflowFollowup.objects.filter(workflow_version=orig_version)

    new_version = deepcopy(orig_version)
    new_version.id = None
    new_version.name = "Copy of " + orig_version.name
    new_version.status = WorkflowVersionsStatus.DRAFT
    new_version.save()

    for oc in orig_changes:
        new_change = deepcopy(oc)
        new_change.workflow_version = new_version
        new_change.id = None
        new_change.save()

    for of in orig_follow_ups:  # Doesn't copy the forms !
        new_followup = deepcopy(of)
        new_followup.workflow_version = new_version
        new_followup.id = None
        new_followup.save()

        new_followup.forms.clear()

        orig_forms = of.forms.all()
        new_followup.forms.add(*orig_forms)

    return new_version


entity_type_id_param = openapi.Parameter(
    "entity_type_id", openapi.IN_QUERY, description="Entity Type ID", type=openapi.TYPE_STRING, required=True
)


class WorkflowVersionViewSet(ModelViewSet):
    """Workflow API
    GET /api/workflowversion/
    GET /api/workflowversion/{version_id}/
    If version_id is provided returns the detail of this workflow version.
    Else returns a paginated list of all the workflow versions.
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")]  # type: ignore
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ["name", "created_at", "updated_at"]
    serializer_class = WorkflowVersionDetailSerializer
    results_key = "workflow_versions"
    remove_results_key_if_paginated = False
    model = WorkflowVersion

    lookup_url_kwarg = "version_id"

    filterset_fields = {"workflow__entity_type": ["exact"]}

    http_method_names = ["get", "post", "patch"]

    @swagger_auto_schema(request_body=no_body)
    @action(detail=True, methods=["post"])
    def copy(self, request, **kwargs):
        """POST /api/workflowversion/{version_id}/copy
        Creates a new workflow version by copying the exiting version given by {version_id}
        """

        version_id = request.query_params.get("version_id", kwargs.get("version_id", None))
        wv_orig = WorkflowVersion.objects.get(pk=version_id)
        new_vw = make_deep_copy_with_relations(wv_orig)
        serialized_data = WorkflowVersionSerializer(new_vw).data
        return Response(serialized_data)

    def partial_update(self, request, *args, **kwargs):
        version_id = request.query_params.get("version_id", kwargs.get("version_id", None))
        wv_orig = get_object_or_404(WorkflowVersion, pk=version_id)

        print("version_id", version_id)
        print("wv_orig before", wv_orig)

        changed_status = request.data.get("status", None)
        changed_name = request.data.get("name", None)

        print("changed_status", changed_status)

        if changed_name is not None:
            wv_orig.name = changed_name

        if changed_status is not None:
            res = wv_orig.transition_to_status(changed_status)
            if not res["success"]:
                return Response(res["error"], status=401)

        wv_orig.save()

        print("wv_orig after", wv_orig)

        serialized_data = WorkflowVersionSerializer(wv_orig).data

        return Response(serialized_data)

    @swagger_auto_schema(manual_parameters=[entity_type_id_param], request_body=no_body)
    def create(self, request, *args, **kwargs):
        """POST /api/workflowversion/?entity_type_id=XXX
        Create a new empty and DRAFT workflow version for the workflow connected to Entity Type 'entity_type_id'
        """
        entity_type_id = request.query_params.get("entity_type_id", None)
        wf, wf_created = Workflow.objects.get_or_create(entity_type_id=entity_type_id)
        wv = WorkflowVersion.objects.create(workflow=wf)
        serialized_data = WorkflowVersionSerializer(wv).data
        return Response(serialized_data)

    def get_queryset(self):
        """Always filter the base queryset by account"""

        return WorkflowVersion.objects.filter(
            workflow__entity_type__account=self.request.user.iaso_profile.account
        ).order_by("pk")
