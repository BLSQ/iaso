import time

from django.db.models import Q

from iaso.models.workflow import WorkflowVersionsStatus
from rest_framework import serializers, permissions
from iaso.models import WorkflowVersion, Project, Workflow
from rest_framework.viewsets import GenericViewSet
from rest_framework.response import Response

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


class MobileWorkflowVersionSerializer(serializers.ModelSerializer):
    version_id = serializers.SerializerMethodField()
    entity_type_id = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowVersion

        fields = ["status", "created_at", "updated_at", "version_id", "entity_type_id", "changes", "follow_ups", "name"]

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

        if self.request.user.is_anonymous:
            return Response(status=401, data="User cannot be anonymous")
        elif not Project.objects.filter(app_id=app_id, account=self.request.user.iaso_profile.account).exists():
            return Response(status=404, data="User not found in Projects for this app id or project not found")

        # project -> account -> users
        queryset = self.get_queryset(**dict(kwargs, app_id=app_id, user=request.user))

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({"workflows": serializer.data})

    def get_queryset(self, **kwargs):
        app_id = kwargs["app_id"]
        user = kwargs["user"]

        ok_wfs = Workflow.objects.filter(
            entity_type__account=user.iaso_profile.account,
            entity_type__reference_form__projects__account=user.iaso_profile.account,
        )

        ok_wfs_ids = list(map(lambda x: x.pk, ok_wfs))

        return (
            WorkflowVersion.objects.filter(workflow__in=ok_wfs_ids)
            .filter(
                Q(follow_ups__forms__projects__account=user.iaso_profile.account)
                | Q(follow_ups__isnull=True)
                | Q(follow_ups__isnull=False, follow_ups__forms__isnull=True)  # no follow ups or no forms on follow ups
            )
            .filter(
                Q(changes__form__projects__account=user.iaso_profile.account)
                | Q(changes__isnull=True)
                | Q(changes__isnull=False, changes__form__isnull=True)  # no changes or no forms on changes
            )
            .order_by("workflow__pk", "-created_at")
            .distinct("workflow__pk")
        )
