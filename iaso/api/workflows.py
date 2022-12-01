from copy import deepcopy
from django.http import Http404

from iaso.models import Workflow, WorkflowVersion, EntityType, WorkflowFollowup, WorkflowChange, Form
from iaso.models.workflow import WorkflowVersionsStatus
from iaso.api.common import Paginator, HasPermission
from iaso.api.entity import EntityTypeSerializer
from iaso.api.forms import FormSerializer

from rest_framework import serializers, permissions
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rest_framework.decorators import action

from django_filters import filters
from django_filters.rest_framework import DjangoFilterBackend


from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema


# Entity Type -> Account : users -> List of users ?
# Entity Type -> Reference form <- Forms <- Project
# Project -> Account

# queryset = form_objects.filter_for_user_and_app_id(self.request.user, self.request.query_params.get("app_id"))
#  user -> iaso_profile -> account


class FormMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = ["id", "name"]


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
    page_size = 10


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


version_id_param = openapi.Parameter("version_id", openapi.IN_QUERY, description="Version ID", type=openapi.TYPE_STRING)


from django.contrib.auth.models import User


def user_can_access_entity_type(entity_type: EntityType, user: User):
    return user.iaso_profile.account.id == entity_type.account.id


def user_can_access_all_forms_of_workflow_all_versions(entity_type: EntityType, user: User):
    if not entity_type.reference_form.projects.filter(account=user.iaso_profile.account).exists():
        return False

    for v in entity_type.workflow.workflow_versions.all():
        if not v.follow_ups.filter(forms__projects__account=user.iaso_profile.account).exists():
            return False

        if not v.changes.filter(form__projects__account=user.iaso_profile.account).exists():
            return False

    return True


def user_can_access_all_forms_of_workflow_version(workflow_version: WorkflowVersion, user: User):
    if not workflow_version.workflow.entity_type.reference_form.projects.filter(
        account=user.iaso_profile.account
    ).exists():
        return False

    if not workflow_version.follow_ups.filter(forms__projects__account=user.iaso_profile.account).exists():
        return False

    if not workflow_version.changes.filter(form__projects__account=user.iaso_profile.account).exists():
        return False

    return True


class WorkflowVersionViewSet(GenericViewSet):
    """Workflow API
    POST /api/workflow/{entity_type_id}/new/?version_id=XXX
    if version_id is provided, copies the content of the version referred to by the version_id
    if version_id is NOT provided, creates a new workflow from scratch (empty).
    The new version is always in DRAFT

    GET /api/workflow/{entity_type_id}/?version_id=XXX
    if version_id is provided, it will return details on this specific version.
    if version_id is NOT provided, it will return the (paginated) list of all versions for this workflow.
    """

    lookup_field = "entity_type_id"
    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")]
    serializer_class = WorkflowVersionSerializer
    pagination_class = WorkflowPaginator

    # filter_backends = [filters.OrderingFilter, DjangoFilterBackend]

    def get_queryset(self):
        pk = self.kwargs.get("entity_type_id", None)
        if pk is None:
            raise Http404("Must provide entity type id/pk")
        else:
            et = get_object_or_404(EntityType, pk=pk)
            wf = get_or_create_wf_for_entity_type(et)
            return wf.workflow_versions.order_by("pk").all()

    @swagger_auto_schema(manual_parameters=[version_id_param])
    def retrieve(self, request, *args, **kwargs):
        entity_type_id = kwargs.get("entity_type_id", None)
        version_id = request.query_params.get("version_id", None)

        if entity_type_id is None:
            return Response(status=404, data="Must provide entity_type_id path param")
        elif version_id is None:
            et = get_object_or_404(EntityType, pk=entity_type_id)

            if not user_can_access_entity_type(et, request.user):
                return Response(status=404, data="User doesn't have access to Entity Type")

            if not user_can_access_all_forms_of_workflow_all_versions(et, request.user):
                return Response(status=404, data="User doesn't have access to all workflow versions forms")

            wf = get_or_create_wf_for_entity_type(et)

            queryset_base = wf.workflow_versions.order_by("pk")

            filter_status = self.request.query_params.get("status")
            if filter_status is not None:
                ok_status = WorkflowVersionsStatus[filter_status.strip().upper()]
                queryset_base = queryset_base.filter(status=ok_status)

            filter_name = self.request.query_params.get("name")
            if filter_name is not None:
                queryset_base = queryset_base.filter(name__icontains=filter_name)

            queryset = queryset_base.all()

            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        else:
            et = get_object_or_404(EntityType, pk=entity_type_id)

            if not user_can_access_entity_type(et, request.user):
                return Response(status=404, data="User doesn't have access to Entity Type")

            the_wf = get_object_or_404(Workflow, entity_type_id=entity_type_id)
            the_version = get_object_or_404(WorkflowVersion, workflow=the_wf, pk=version_id)

            if not user_can_access_all_forms_of_workflow_version(the_version, request.user):
                return Response(status=404, data="User doesn't have access to workflow version " + str(the_version.pk))

            serialized_data = WorkflowVersionDetailSerializer(the_version, context={"request": request}).data
            return Response(serialized_data)

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
            wv = WorkflowVersion.objects.create(workflow=Workflow.objects.get(entity_type_id=entity_type_id))
            serialized_data = WorkflowVersionSerializer(wv).data
            return Response(serialized_data)
        else:
            wv_orig = WorkflowVersion.objects.get(pk=version_id)
            new_vw = make_deep_copy_with_relations(wv_orig)
            serialized_data = WorkflowVersionSerializer(new_vw).data
            return Response(serialized_data)
