import math
from django.http import Http404

from iaso.models import Workflow, WorkflowVersion, EntityType
from .common import ModelViewSet, TimestampField
from rest_framework import serializers, permissions, pagination, mixins
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from iaso.models.workflow import WorkflowVersionsStatus


class WorkflowVersionSerializer(serializers.ModelSerializer):
    version_id = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowVersion

        fields = ["status", "created_at", "updated_at", "version_id"]

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


def get_or_create_wf_for_entity_type(et):
    try:
        wf = Workflow.objects.get(entity_type=et)
    except Workflow.DoesNotExist:
        wf = Workflow.objects.create(entity_type=et)

    return wf


class CustomPagination2(pagination.LimitOffsetPagination):
    default_limit = 2

    def get_paginated_response(self, data):
        return Response(
            {
                "has_next": self.count > self.limit and self.offset * self.limit < self.count,
                "has_previous": self.offset > 0,
                "pages": math.ceil(self.count / self.limit),
                "page": self.offset,
                "limit": self.limit,
                "count": self.count,
                "results": data,
            }
        )


class WorkflowViewSet(GenericViewSet):
    """Workflow API

    Return the workflow versions for the workflow associated with the provided entity_type_id

    GET /api/workflow/{entity_type_id}/
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkflowVersionSerializer
    pagination_class = CustomPagination2
    results_key = "workflows"
    queryset = Workflow.objects.all()

    def retrieve(self, request, *args, **kwargs):
        queryset = self.get_queryset(**kwargs)

        print("paginator", self.paginator)

        page = self.paginate_queryset(queryset)

        print("page", page)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_queryset(self, **kwargs):
        pk = kwargs.get("pk", None)
        if pk is None:
            raise Http404("Must provide entity type id/pk")
        else:
            et = get_object_or_404(EntityType, pk=pk)
            wf = get_or_create_wf_for_entity_type(et)
            return wf.workflow_versions.all()
