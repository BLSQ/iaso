import datetime
import time

from iaso.models.workflow import WorkflowVersionsStatus
from iaso.api.workflows import WorkflowViewSet
from rest_framework import serializers
from iaso.models import Workflow, WorkflowVersion, EntityType


class MobileWorkflowVersionSerializer(serializers.ModelSerializer):
    version_id = serializers.SerializerMethodField()
    entity_type_id = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowVersion

        fields = ["status", "created_at", "updated_at", "version_id"]

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


class MobileWorkflowViewSet(WorkflowViewSet):
    serializer_class = MobileWorkflowVersionSerializer

    def get_queryset(self, **kwargs):

        all_ets = EntityType.objects.all()

        for et in all_ets:
            


        if pk is None:
            raise Http404("Must provide entity type id/pk")
        else:
            et = get_object_or_404(EntityType, pk=pk)
            wf = get_or_create_wf_for_entity_type(et)
            return wf.workflow_versions.all()
