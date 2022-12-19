from copy import deepcopy

from iaso.models import Workflow, WorkflowVersion, EntityType, WorkflowFollowup, WorkflowChange, Form
from iaso.models.workflow import WorkflowVersionsStatus
from iaso.api.common import ModelViewSet, HasPermission

from rest_framework import serializers, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore

from drf_yasg.utils import swagger_auto_schema, no_body

from django.shortcuts import get_object_or_404


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


class WorkflowFollowupCreateSerializer(serializers.Serializer):
    order = serializers.IntegerField()
    condition = serializers.JSONField()
    forms = serializers.ListField(child=serializers.IntegerField())

    def validate_forms(self, forms):
        print("validate_forms : START")
        user = self.context["request"].user

        for form_id in forms:
            if not Form.objects.filter(pk=form_id).exists():
                raise serializers.ValidationError(f"Form {form_id} does not exist")

            form = Form.objects.get(pk=form_id)
            for p in form.projects.all():
                if p.account != user.iaso_profile.account:
                    raise serializers.ValidationError(f"User doesn't have access to form {form_id}")

        print("validate_forms : END")
        return forms

    def create(self, validated_data):
        print("Create : START")
        version_id = self.context["version_id"]

        wfv = get_object_or_404(WorkflowVersion, pk=version_id)
        wf = WorkflowFollowup.objects.create(
            order=validated_data["order"], condition=validated_data["condition"], workflow_version=wfv
        )

        wf.conditions = validated_data["condition"]
        wf.order = validated_data["order"]

        wf.forms.set(validated_data["forms"])
        wf.save()

        print("Create : END")
        return wf


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
    name = serializers.CharField(required=False)

    def validate_name(self, new_name):
        if len(new_name) <= 1:
            raise serializers.ValidationError("name '" + new_name + "' is too short")
        return new_name

    def validate_entity_type_id(self, entity_type_id):
        et = EntityType.objects.get(pk=entity_type_id)

        if not et.account == self.context["request"].user.iaso_profile.account:
            raise serializers.ValidationError("User doesn't have access to Entity Type : " + str(entity_type_id))

        return entity_type_id

    def create(self, validated_data):
        entity_type_id = validated_data["entity_type_id"]
        wf, wf_created = Workflow.objects.get_or_create(entity_type_id=entity_type_id)

        wfv = WorkflowVersion.objects.create(workflow=wf)
        et = EntityType.objects.get(pk=entity_type_id)
        wfv.reference_form = et.reference_form
        if "name" in validated_data:
            wfv.name = validated_data["name"]
        wfv.save()
        return wfv


class WorkflowPartialUpdateSerializer(serializers.Serializer):

    status = serializers.CharField(required=False)
    name = serializers.CharField(required=False)

    def validate_status(self, new_status):
        if hasattr(WorkflowVersionsStatus, new_status):
            return new_status
        else:
            raise serializers.ValidationError(new_status + "is not recognized as proper status value")

    def validate_name(self, new_name):
        if len(new_name) <= 1:
            raise serializers.ValidationError("name '" + new_name + "' is too short")
        return new_name

    def update(self, instance, validated_data):
        instance_changed = False

        if "name" in validated_data:
            instance.name = validated_data["name"]
            instance_changed = True

        if "status" in validated_data:
            res = instance.transition_to_status(validated_data["status"], do_save=False)

            if not res["success"]:
                raise serializers.ValidationError(res["error"])
            else:
                instance_changed = True

        if instance_changed:
            instance.save()

        return instance


def validate_version_id(version_id, user):
    wfv = get_object_or_404(WorkflowVersion, pk=version_id)
    et = get_object_or_404(EntityType, pk=wfv.workflow.entity_type_id)

    if wfv.status != WorkflowVersionsStatus.DRAFT:
        raise serializers.ValidationError(f"WorkflowVersion {version_id} is not in draft status")

    if not et.account == user.iaso_profile.account:
        raise serializers.ValidationError(f"User doesn't have access to Entity Type : {wfv.workflow.entity_type_id}")

    print("validate_version_id: OK")
    return version_id


class WorkflowVersionViewSet(ModelViewSet):
    """Workflow API
    GET /api/workflowversions/
    GET /api/workflowversions/{version_id}/
    If version_id is provided returns the detail of this workflow version.
    Else returns a paginated list of all the workflow versions.
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")]  # type: ignore
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ["name", "created_at", "updated_at", "id", "status"]
    serializer_class = WorkflowVersionDetailSerializer
    results_key = "workflow_versions"
    remove_results_key_if_paginated = False
    model = WorkflowVersion
    lookup_url_kwarg = "version_id"
    filterset_fields = {"workflow__entity_type": ["exact"], "status": ["exact"], "id": ["exact"]}
    http_method_names = ["get", "post", "patch", "delete"]

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

    @swagger_auto_schema(request_body=WorkflowFollowupCreateSerializer)
    @action(detail=True, methods=["post"])
    def followup(self, request, *args, **kwargs):
        """POST /api/workflowversions/{version_id}/followup
        Creates a new followup for WorkflowVersion {version_id} with the body data
        """
        version_id = request.query_params.get("version_id", kwargs.get("version_id", None))
        validate_version_id(version_id, request.user)

        serializer = WorkflowFollowupCreateSerializer(
            data=request.data, context={"request": request, "version_id": version_id}
        )
        serializer.is_valid(raise_exception=True)
        res = serializer.save()

        serialized_data = WorkflowFollowupSerializer(res).data
        return Response(serialized_data)

    @swagger_auto_schema(request_body=WorkflowPartialUpdateSerializer)
    def partial_update(self, request, *args, **kwargs):
        version_id = request.query_params.get("version_id", kwargs.get("version_id", None))
        wv_orig = get_object_or_404(WorkflowVersion, pk=version_id)

        serializer = WorkflowPartialUpdateSerializer(data=request.data, context={"request": request}, partial=True)
        serializer.is_valid(raise_exception=True)
        res = serializer.update(wv_orig, serializer.validated_data)
        serialized_data = WorkflowVersionSerializer(res).data
        return Response(serialized_data)

    @swagger_auto_schema(request_body=WorkflowPostSerializer)
    def create(self, request, *args, **kwargs):
        """POST /api/workflowversions/
        Create a new empty and DRAFT workflow version for the workflow connected to Entity Type 'entity_type_id'
        """
        serializer = WorkflowPostSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        res = serializer.save()
        serialized_data = WorkflowVersionSerializer(res).data
        return Response(serialized_data)

    def get_queryset(self):
        """Always filter the base queryset by account"""
        return WorkflowVersion.objects.filter_for_user(self.request.user).order_by("pk")
