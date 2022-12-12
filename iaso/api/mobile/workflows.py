import time

from django.db.models import Q

from iaso.models.workflow import WorkflowVersionsStatus
from rest_framework import serializers, permissions
from iaso.models import WorkflowVersion, Project, Workflow
from rest_framework.viewsets import GenericViewSet
from rest_framework.response import Response

from iaso.api.common import TimestampField

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


class MobileWorkflowVersionSerializer(serializers.ModelSerializer):
    version_id = serializers.IntegerField(source="pk")
    entity_type_id = serializers.IntegerField(source="workflow.entity_type.pk")

    created_at = TimestampField()
    updated_at = TimestampField()

    class Meta:
        model = WorkflowVersion

        fields = [
            "status",
            "created_at",
            "updated_at",
            "version_id",
            "entity_type_id",
            "changes",
            "follow_ups",
            "name",
        ]


app_id_param = openapi.Parameter(
    name="app_id", in_=openapi.IN_QUERY, description="The app id", type=openapi.TYPE_STRING, required=True
)


class MobileWorkflowViewSet(GenericViewSet):
    """Mobile workflow API

    Return the workflow versions for the workflow associated with the provided entity_type_id
    This endpoint is NOT paginated.

    GET /api/mobile/workflow/
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MobileWorkflowVersionSerializer
    results_key = "workflows"

    pagination_class = None
    paginator = None

    @swagger_auto_schema(manual_parameters=[app_id_param])
    def list(self, request, *args, **kwargs):
        app_id = request.GET.get("app_id", None)

        if app_id is None:
            return Response(status=404, data="No app_id provided")

        if not Project.objects.filter(app_id=app_id, account=self.request.user.iaso_profile.account).exists():
            return Response(status=404, data="User not found in Projects for this app id or project not found")

        # project -> account -> users
        queryset = self.get_queryset(**dict(kwargs, user=request.user))
        serializer = self.get_serializer(queryset, many=True)
        return Response({"workflows": serializer.data})

    def get_queryset(self, **kwargs):
        user = kwargs["user"]

        return (
            WorkflowVersion.objects.filter(workflow__entity_type__account=user.iaso_profile.account)
            .order_by("workflow__pk", "-created_at")
            .distinct("workflow__pk")
        )
