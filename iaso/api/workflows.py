from copy import deepcopy
from django.http import Http404

from iaso.models import Workflow, WorkflowVersion, EntityType, WorkflowFollowup, WorkflowChange, Form
from iaso.models.workflow import WorkflowVersionsStatus
from iaso.api.entity import EntityTypeSerializer

from rest_framework import serializers, filters, permissions
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore

from iaso.api.common import ModelViewSet, DeletionFilterBackend, HasPermission


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
        new_change.workflow = new_version
        new_change.id = None
        new_change.save()

        return new_change

    return clone_change_real


def clone_followup(new_version):
    def clone_followup_real(orig_followup):
        new_followup = deepcopy(orig_followup)
        new_followup.workflow = new_version
        new_followup.id = None
        new_followup.save()

        return new_followup

    return clone_followup_real


def make_deep_copy_with_relations(orig_version):
    orig_changes = WorkflowChange.objects.filter(workflow=orig_version)
    orig_follow_ups = WorkflowFollowup.objects.filter(workflow=orig_version)

    new_version = deepcopy(orig_version)
    new_version.id = None
    new_version.name = "Copy of " + orig_version.name
    new_version.status = WorkflowVersionsStatus.DRAFT
    new_version.save()

    for oc in orig_changes:
        new_change = deepcopy(oc)
        new_change.workflow = new_version
        new_change.id = None
        new_change.save()

    for of in orig_follow_ups:  # Doesn't copy the forms !
        new_followup = deepcopy(of)
        new_followup.workflow = new_version
        new_followup.id = None
        new_followup.save()

        new_followup.forms.clear()

        orig_forms = of.forms.all()
        new_followup.forms.add(*orig_forms)

    return new_version


class WorkflowVersionViewSet(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")]  # type: ignore
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ["name", "created_at"]
    serializer_class = WorkflowVersionDetailSerializer
    results_key = "workflow_versions"
    remove_results_key_if_paginated = False
    model = WorkflowVersion

    filterset_fields = {
        "workflow__entity_type": ["exact"],
    }

    http_method_names = ["get"]
    # http_method_names = ["get", "head", "options", "trace"]

    def get_queryset(self):
        """Always filter the base queryset by account"""

        return WorkflowVersion.objects.filter(
            workflow__entity_type__account=self.request.user.iaso_profile.account
        ).order_by("pk")
