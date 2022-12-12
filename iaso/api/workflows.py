from copy import deepcopy

from django.contrib.auth.models import User
from iaso.models import Workflow, WorkflowVersion, EntityType, WorkflowFollowup, WorkflowChange, Form
from iaso.models.workflow import WorkflowVersionsStatus


from rest_framework import serializers, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore

from iaso.api.common import ModelViewSet, HasPermission

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema, no_body


class FormNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = ["id", "name"]


class EntityTypeNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityType
        fields = ["id", "name", "reference_form"]


class WorkflowVersionSerializer(serializers.ModelSerializer):
    version_id = serializers.IntegerField(source="id")

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
    form = FormNestedSerializer(many=False)

    class Meta:
        model = WorkflowChange
        fields = ["form", "mapping", "created_at", "updated_at"]


class WorkflowFollowupSerializer(serializers.ModelSerializer):
    forms = FormNestedSerializer(many=True)

    class Meta:
        model = WorkflowFollowup
        fields = ["id", "order", "condition", "forms", "created_at", "updated_at"]


class WorkflowVersionDetailSerializer(serializers.ModelSerializer):
    version_id = serializers.IntegerField(source="pk")
    reference_form = FormNestedSerializer()
    entity_type = EntityTypeNestedSerializer(source="workflow.entity_type")
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

        orig_forms = of.forms.all()
        new_followup.forms.set(*orig_forms)

    return new_version


class WorkflowPostSerializer(serializers.Serializer):
    entity_type_id = serializers.IntegerField(required=True)
    user_id = serializers.IntegerField(required=True)

    def validate(self, data):
        et = EntityType.objects.get(pk=data["entity_type_id"])
        usr = User.objects.get(pk=data["user_id"])
        if not et.account == usr.iaso_profile.account:
            raise serializers.ValidationError(
                "User doesn't have access to Entity Type : " + str(data["entity_type_id"])
            )

        return data

    def create(self, validated_data):
        wf, wf_created = Workflow.objects.get_or_create(entity_type_id=validated_data["entity_type_id"])
        return WorkflowVersion.objects.create(workflow=wf)


class WorkflowVersionViewSet(ModelViewSet):
    """Workflow API
    GET /api/workflowversions/
    GET /api/workflowversions/{version_id}/
    If version_id is provided returns the detail of this workflow version.
    Else returns a paginated list of all the workflow versions.
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")]  # type: ignore
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ["name", "created_at", "updated_at", "id"]
    serializer_class = WorkflowVersionDetailSerializer
    results_key = "workflow_versions"
    remove_results_key_if_paginated = False
    model = WorkflowVersion
    lookup_url_kwarg = "version_id"
    filterset_fields = {"workflow__entity_type": ["exact"], "status": ["exact"], "id": ["exact"]}
    http_method_names = ["get", "post"]

    @swagger_auto_schema(request_body=no_body)
    @action(detail=True, methods=["post"])
    def copy(self, request, **kwargs):
        """POST /api/workflowversions/{version_id}/copy
        Creates a new workflow version by copying the exiting version given by {version_id}
        """

        version_id = request.query_params.get("version_id", kwargs.get("version_id", None))
        wv_orig = WorkflowVersion.objects.get(pk=version_id)
        new_vw = make_deep_copy_with_relations(wv_orig)
        serialized_data = WorkflowVersionSerializer(new_vw).data
        return Response(serialized_data)

    @swagger_auto_schema(request_body=WorkflowPostSerializer)
    def create(self, request, *args, **kwargs):
        """POST /api/workflowversions/
        Create a new empty and DRAFT workflow version for the workflow connected to Entity Type 'entity_type_id'
        """
        user_info = {"user_id": request.user.pk}
        serializer = WorkflowPostSerializer(data={**request.data, **user_info})
        serializer.is_valid(raise_exception=True)
        res = serializer.save()
        serialized_data = WorkflowVersionSerializer(res).data
        return Response(serialized_data)

    def get_queryset(self):
        """Always filter the base queryset by account"""
        return WorkflowVersion.objects.filter_for_user(self.request.user)
