import datetime
import time

from iaso.models.workflow import WorkflowVersionsStatus
from iaso.api.workflows import WorkflowViewSet, get_or_create_wf_for_entity_type
from rest_framework import serializers, permissions, pagination, mixins
from iaso.models import Workflow, WorkflowVersion, EntityType
from rest_framework.viewsets import GenericViewSet
from rest_framework.response import Response


class MobileWorkflowVersionSerializer(serializers.ModelSerializer):
    version_id = serializers.SerializerMethodField()
    entity_type_id = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowVersion

        fields = ["status", "created_at", "updated_at", "version_id", "entity_type_id", "changes", "follow_ups"]

    @staticmethod
    def get_version_id(instance):
        return instance.pk

    @staticmethod
    def get_entity_type_id(instance):
        return instance.workflow.entity_type.pk

    @staticmethod
    def get_created_at(instance):
        return time.mktime(instance.created_at.timetuple())

    @staticmethod
    def get_updated_at(instance):
        return time.mktime(instance.updated_at.timetuple())

    @staticmethod
    def get_status(instance):
        return WorkflowVersionsStatus(instance.status).name


class MobileWorkflowViewSet(GenericViewSet):
    """Mobile orkflow API

    Return the workflow versions for the workflow associated with the provided entity_type_id

    GET /api/mobile/workflow/
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MobileWorkflowVersionSerializer
    results_key = "workflows"

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset(**kwargs)

        print("paginator", self.paginator)

        page = self.paginate_queryset(queryset)

        print("page", page)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({"workflows": serializer.data})

    def get_queryset(self, **kwargs):
        return WorkflowVersion.objects.order_by("workflow__pk", "-created_at").distinct("workflow__pk")
