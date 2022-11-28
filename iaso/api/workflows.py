import math
from copy import deepcopy
from django.http import Http404

from iaso.models import Workflow, WorkflowVersion, EntityType, WorkflowFollowup, WorkflowChange
from iaso.models.workflow import WorkflowVersionsStatus
from iaso.api.common import Paginator, HasPermission
from iaso.api.entity import EntityTypeSerializer
from iaso.api.forms import FormSerializer

from rest_framework import serializers, permissions
from rest_framework.generics import get_object_or_404, ListAPIView, RetrieveAPIView, CreateAPIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.viewsets import GenericViewSet
from rest_framework.decorators import action


from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema


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


class WorkflowChangeSerializer(serializers.ModelSerializer):
    form_id = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowChange
        fields = ["form_id", "mapping", "created_at", "updated_at"]

    @staticmethod
    def get_form_id(instance):
        return instance.form.pk


class WorkflowFollowupSerializer(serializers.ModelSerializer):
    form_ids = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowFollowup
        fields = ["id", "order", "condition", "form_ids", "created_at", "updated_at"]

    @staticmethod
    def get_form_ids(instance):
        return list(map(lambda x: x.pk, instance.forms.all()))


class WorkflowVersionDetailSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    version_id = serializers.SerializerMethodField()
    reference_form = serializers.SerializerMethodField()
    entity_type = serializers.SerializerMethodField()
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

    @staticmethod
    def get_entity_type(instance):
        return EntityTypeSerializer(instance.workflow.entity_type).data

    def get_reference_form(self, instance):
        return FormSerializer(instance.reference_form, context=self.context).data

    @staticmethod
    def get_version_id(instance):
        return instance.pk

    @staticmethod
    def get_status(instance):
        return WorkflowVersionsStatus(instance.status).name


def get_or_create_wf_for_entity_type(et):
    try:
        wf = Workflow.objects.get(entity_type=et)
    except Workflow.DoesNotExist:
        wf = Workflow.objects.create(entity_type=et)

    return wf


class WorkflowPaginator(Paginator):
    page_size = 2


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


def workflow_version_post_real(entity_type_id, version_id=None):
    if entity_type_id is None:
        return Response(status=404, data="Must provide entity type id/pk")

    if version_id is None:
        wv = WorkflowVersion.objects.create(workflow=Workflow.objects.get(entity_type_id=entity_type_id))
        seri_data = WorkflowVersionSerializer(wv).data
        return Response(seri_data)
    else:
        wv_orig = WorkflowVersion.objects.get(pk=version_id)
        new_vw = make_deep_copy_with_relations(wv_orig)
        seri_data = WorkflowVersionSerializer(new_vw).data
        return Response(seri_data)


def workflow_version_get(request, entity_type_id, version_id):
    if entity_type_id is None:
        return Response(status=404, data="Must provide entity_type_id path param")
    elif version_id is None:
        return Response(status=404, data="Must provide version_id path param")
    else:

        the_wf = get_object_or_404(Workflow, entity_type_id=entity_type_id)
        the_version = get_object_or_404(WorkflowVersion, workflow=the_wf, pk=version_id)
        fake_context = {}
        fake_context["request"] = request
        seri = WorkflowVersionDetailSerializer(the_version, context=fake_context)

        return Response(seri.data)


@api_view(["POST", "GET"])
@permission_classes([permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")])
def workflow_version_versionid(request, entity_type_id, version_id):
    if request.method == "GET":
        return workflow_version_get(request, entity_type_id, version_id)
    elif request.method == "POST":
        return workflow_version_post_real(entity_type_id, version_id)
    else:
        return Response(status=403, data="Forbidden Method")


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")])
def workflow_version_new(request, entity_type_id):
    return workflow_version_post_real(entity_type_id, None)


# class WorkflowVersion(ModelViewSet):
#     lookup_field = 'entity_type_id'
#     lookup_url_kwarg = 'entity_type_id'
#
#     @action(methods=['post'], url_path="versions", url_name="clone_version")
#     def versions_clone(self, request, entity_type_id):
#         print("versions_clone request", request)
#
#     @action(methods=['get'], url_path="versions", url_name="list_versions"):
#     def versions_list(self, request, entity_type_id):
#         print("versions_list request", request)

version_id_param = openapi.Parameter("version_id", openapi.IN_QUERY, description="Version ID", type=openapi.TYPE_STRING)
version_id_param_required = openapi.Parameter(
    "version_id", openapi.IN_QUERY, description="Version ID", type=openapi.TYPE_STRING, required=True
)
entity_type_id_param = openapi.Parameter(
    "entity_type_id", openapi.IN_PATH, description="Entity Type ID", type=openapi.TYPE_STRING
)


class WorkflowVersionPost(GenericViewSet):
    """Workflow API
    POST /api/workflow/{entity_type_id}/version/?version_id=XXX
    version_id is not mandatory.
    This endpoint either:
        creates a new workflow from scratch (empty) if the version_id is not provided
        copies the content of the version referred to by the version_id
    The new version is always in DRAFT

    GET /api/workflow/{entity_type_id}/version/?version_id=XXX
    version_id is mandatory
    """

    lookup_field = "entity_type_id"
    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")]
    serializer_class = WorkflowVersionSerializer

    @swagger_auto_schema(manual_parameters=[version_id_param_required])
    def retrieve(self, request, *args, **kwargs):
        entity_type_id = kwargs.get("entity_type_id", None)
        version_id = request.query_params.get("version_id", None)

        return workflow_version_get(request, entity_type_id, version_id)

    @swagger_auto_schema(manual_parameters=[version_id_param], request_body=None)
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")],
    )
    def new(self, request, entity_type_id):
        version_id = request.query_params.get("version_id", None)

        if entity_type_id is None:
            return Response(status=404, data="Must provide entity type id/pk")

        if version_id is None:
            return workflow_version_post_real(entity_type_id, None)
        else:
            return workflow_version_post_real(entity_type_id, version_id)

    # def create(self, request, *args, **kwargs):
    #
    #     entity_type_id = kwargs.get("entity_type_id", None)
    #     version_id = request.query_params.get("version_id", None)
    #
    #     if entity_type_id is None:
    #         return Response(status=404, data="Must provide entity type id/pk")
    #
    #     if version_id is None:
    #         return workflow_version_post_real(entity_type_id, None)
    #     else:
    #         return workflow_version_post_real(entity_type_id, version_id)


class WorkflowVersionDetail(RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")]
    serializer_class = WorkflowVersionDetailSerializer

    def get(self, request, *args, **kwargs):
        entity_type_id = kwargs.get("entity_type_id", None)
        version_id = kwargs.get("version_id", None)

        if entity_type_id is None:
            return Response(status=404, data="Must provide entity_type_id path param")
        elif version_id is None:
            return Response(status=404, data="Must provide version_id path param")
        else:

            the_wf = get_object_or_404(Workflow, entity_type_id=entity_type_id)
            the_version = get_object_or_404(WorkflowVersion, workflow=the_wf, pk=version_id)
            seri = self.get_serializer(the_version)

            return Response(seri.data)


class WorkflowVersionList(ListAPIView):
    """Workflow API

    Return the workflow versions for the workflow associated with the provided entity_type_id.
    Returns are paginated with the usual page, limit paginator.

    GET /api/workflow/{entity_type_id}/
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")]
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
