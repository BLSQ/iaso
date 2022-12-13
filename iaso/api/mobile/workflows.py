import json

from rest_framework import serializers, permissions
from iaso.models import WorkflowVersion, Project, WorkflowFollowup
from rest_framework.viewsets import GenericViewSet
from rest_framework.response import Response

from iaso.api.common import TimestampField

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


class FollowupNestedSerializer(serializers.ModelSerializer):

    condition = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowFollowup
        fields = ["order", "condition", "forms", "created_at", "updated_at"]

    def get_condition(self, obj):
        return json.dumps(obj.condition)


class MobileWorkflowVersionSerializer(serializers.ModelSerializer):
    version_id = serializers.IntegerField(source="pk")
    entity_type_id = serializers.IntegerField(source="workflow.entity_type.pk")
    follow_ups = FollowupNestedSerializer(many=True)

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
        queryset = self.get_queryset(**kwargs)
        serializer = self.get_serializer(queryset, many=True)
        return Response({"workflows": serializer.data})

    def get_queryset(self, **kwargs):
        return (
            WorkflowVersion.objects.filter_for_user(self.request.user)
            .order_by("workflow__pk", "-created_at")
            .distinct("workflow__pk")
        )
