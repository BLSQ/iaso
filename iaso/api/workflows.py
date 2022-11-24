import math
from django.http import Http404

from iaso.models import Workflow, WorkflowVersion, EntityType
from iaso.models.workflow import WorkflowVersionsStatus
from iaso.api.common import Paginator

from rest_framework import serializers, permissions
from rest_framework.generics import get_object_or_404, ListAPIView, CreateAPIView, RetrieveAPIView
from rest_framework.response import Response


class WorkflowVersionSerializer(serializers.ModelSerializer):
    version_id = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowVersion

        fields = ["status", "created_at", "updated_at", "version_id", "name"]

    @staticmethod
    def get_version_id(instance):
        return instance.pk

    @staticmethod
    def get_status(instance):
        return WorkflowVersionsStatus(instance.status).name


class WorkflowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workflow

        fields = [
            "entity_type_id",
            "created_at",
            "updated_at",
        ]


class WorkflowDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workflow

        fields = [
            "entity_type_id",
            "created_at",
            "updated_at",
        ]


def get_or_create_wf_for_entity_type(et):
    try:
        wf = Workflow.objects.get(entity_type=et)
    except Workflow.DoesNotExist:
        wf = Workflow.objects.create(entity_type=et)

    return wf


class WorkflowPaginator(Paginator):
    page_size = 2


class WorkflowVersionPost(CreateAPIView):
    """Workflow API
    POST /api/workflow/{entity_type_id}/version/{version_id}

    version_id is not mandatory.

    This endpoint either:
        creates a new workflow from scratch (empty) if the version_id is not provided
        copies the content of the version referred to by the version_id

    The new version is always in DRAFT
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkflowVersionSerializer

    def post(self, request, *args, **kwargs):

        entity_type_id = kwargs.get("entity_type_id", None)
        version_id = kwargs.get("version_id", None)

        if entity_type_id is None:
            return Response(status=404, data="Must provide entity type id/pk")

        if version_id is None:
            wv = WorkflowVersion.objects.create(workflow=Workflow.objects.get(entity_type_id=entity_type_id))
            seri_data = self.get_serializer(wv).data
            return Response(seri_data)
        else:
            wv_orig = WorkflowVersion.objects.get(pk=version_id)
            wv_orig.pk = None
            wv_orig.name = "Copy from " + wv_orig.name
            wv_orig.save()
            seri_data = self.get_serializer(wv_orig).data
            return Response(seri_data)


class WorkflowVersionDetail(RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkflowDetailSerializer

    def get(self, request, *args, **kwargs):
        entity_type_id = kwargs.get("entity_type_id", None)
        version_id = kwargs.get("version_id", None)

        if entity_type_id is None:
            return Response(status=404, data="Must provide entity_type_id path param")
        elif version_id is None:
            return Response(status=404, data="Must provide version_id path param")
        else:
            return Response("Will process")


class WorkflowVersionList(ListAPIView):
    """Workflow API

    Return the workflow versions for the workflow associated with the provided entity_type_id.
    Returns are paginated with the usual page, limit paginator.

    GET /api/workflow/{entity_type_id}/
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkflowVersionSerializer
    pagination_class = WorkflowPaginator

    def get_queryset(self, **kwargs):
        pk = kwargs.get("entity_type_id", None)
        if pk is None:
            raise Http404("Must provide entity type id/pk")
        else:
            et = get_object_or_404(EntityType, pk=pk)
            wf = get_or_create_wf_for_entity_type(et)
            return wf.workflow_versions.all()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset(**kwargs))

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
