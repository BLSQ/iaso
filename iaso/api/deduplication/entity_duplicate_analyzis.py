from django.contrib.auth.models import User
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, permissions, serializers, status
from rest_framework.response import Response

import iaso.models.base as base
import iaso.permissions as core_permissions

from iaso.api.common import HasPermission, ModelViewSet, Paginator
from iaso.models import Entity, EntityDuplicateAnalyzis, EntityType, Form
from iaso.models.deduplication import PossibleAlgorithms
from iaso.tasks.run_deduplication_algo import run_deduplication_algo


def field_exists(f: Form, field_name: str) -> bool:
    try:
        for field in f.possible_fields:
            if field["name"] == field_name:
                return True

        return False
    except:
        return False


class AnalyzePostBodySerializer(serializers.Serializer):
    algorithm = serializers.ChoiceField(choices=PossibleAlgorithms.choices)
    entity_type_id = serializers.CharField()
    fields = serializers.ListField(child=serializers.CharField())  # type: ignore
    parameters = serializers.ListField(child=serializers.DictField())

    def validate(self, data):
        data = super().validate(data)

        try:
            e_type = EntityType.objects.get(pk=data["entity_type_id"])
        except Entity.DoesNotExist:
            raise serializers.ValidationError("Entity type does not exist")

        for f_name in data["fields"]:
            if not field_exists(e_type.reference_form, f_name):
                raise serializers.ValidationError(f"Field {f_name} does not exist on reference form")

        return data


class EntityDuplicateAnalyzisSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityDuplicateAnalyzis
        fields = "__all__"


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = ["id", "username"]


class EntityDuplicateAnalyzisDetailSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(source="task.status", choices=base.STATUS_TYPE_CHOICES)
    started_at = serializers.DateTimeField(source="task.started_at")
    created_by = UserNestedSerializer(source="task.launcher")
    entity_type_id = serializers.SerializerMethodField()
    fields = serializers.SerializerMethodField(method_name="get_the_fields")  # type: ignore
    parameters = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(source="task.created_at")

    def get_entity_type_id(self, obj):
        return obj.metadata["entity_type_id"]

    def get_parameters(self, obj):
        return obj.metadata["parameters"]

    def get_the_fields(self, obj):
        return obj.metadata["fields"]

    class Meta:
        model = EntityDuplicateAnalyzis
        fields = [
            "id",
            "status",
            "started_at",
            "created_by",
            "algorithm",
            "entity_type_id",
            "fields",
            "parameters",
            "finished_at",
            "created_at",
            "finished_at",
        ]


class EntityDuplicateAnalyzisViewSet(ModelViewSet):
    """
    Entity Duplicates API

    GET /api/entityduplicates/analyzes : Provides an API to retrieve the list of running and finished analyzes
    POST /api/entityduplicates/analyzes : Provides an API to launch a duplicate analyzes
    GET /api/entityduplicates/analyzes/{id} : Provides an API to retrieve the status of an analyze
    PATCH /api/entityduplicates/analyzes/{id} : Provides an API to change the status of an analyze
    DELETE /api/entityduplicates/analyzes/{id} : Provides an API to delete the possible duplicates of an analyze
    """

    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
    ]
    ordering_fields = ["created_at", "finished_at", "id"]
    results_key = "results"
    pagination_class = Paginator

    def get_queryset(self):
        user_account = self.request.user.iaso_profile.account
        return EntityDuplicateAnalyzis.objects.filter(task__account=user_account).select_related("task__created_by")

    def get_permissions(self):
        permission_classes = [permissions.IsAuthenticated, HasPermission(core_permissions.ENTITIES_DUPLICATE_READ)]
        if self.action in ["partial_update", "destroy", "create"]:
            permission_classes += [HasPermission(core_permissions.ENTITIES_DUPLICATE_WRITE)]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return EntityDuplicateAnalyzisDetailSerializer
        return EntityDuplicateAnalyzisSerializer

    def partial_update(self, request, pk=None, *args, **kwargs):
        """
        PATCH /api/entityduplicates_analyzes/{id}/
        Provides an API to change the status of an analyze
        Send {"status": "QUEUED"} or {"status": "KILLED"} to change the status of the analyze
        Only allowed transitions are "KILLED" -> "QUEUED" and "QUEUED", "RUNNING" -> "KILLED"
        Needs iaso_entity_duplicates_write permission
        """

        if not request.user.has_perm(core_permissions.ENTITIES_DUPLICATE_WRITE):
            return Response(status=status.HTTP_403_FORBIDDEN)

        try:
            eda = EntityDuplicateAnalyzis.objects.get(pk=pk)
        except:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if eda.task.status == base.KILLED and request.data["status"] == base.QUEUED:
            eda.task.status = base.QUEUED
            eda.task.save()
            return Response(status=status.HTTP_200_OK)

        if eda.task.status in [base.QUEUED, base.RUNNING] and request.data["status"] == base.KILLED:
            eda.task.status = base.KILLED
            eda.task.save()
            return Response(status=status.HTTP_200_OK)

        return Response(
            status=status.HTTP_400_BAD_REQUEST,
            data={
                "error": "Invalid status transition, only allowed are KILLED -> QUEUED and QUEUED, RUNNING -> KILLED"
            },
        )

    def destroy(self, request, pk=None, *args, **kwargs):
        """
        DELETE /api/entityduplicates_analyzes/{id}/
        Provides an API to delete the possible duplicates of an analyze
        Needs iaso_entity_duplicates_write permission
        """
        if not request.user.has_perm(core_permissions.ENTITIES_DUPLICATE_WRITE):
            return Response(status=status.HTTP_403_FORBIDDEN)

        try:
            obj = EntityDuplicateAnalyzis.objects.get(pk=pk)

        except EntityDuplicateAnalyzis.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        obj.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @swagger_auto_schema(
        request_body=AnalyzePostBodySerializer,
    )
    def create(self, request, *args, **kwargs):
        """
        POST /api/entityduplicates_analyzes/
        example body:
        {
            "algorithm": "namesim", "invert"
            "entity_type_id": String,
            "fields": String[],
            "parameters": {}, #vary for each algorithm
        }
        Provides an API to launch a duplicate analyzes
        Needs iaso_entity_duplicates_write permission
        """

        if not request.user.has_perm(core_permissions.ENTITIES_DUPLICATE_WRITE):
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = AnalyzePostBodySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        algo_name = data["algorithm"]

        algo_params = {
            "entity_type_id": data["entity_type_id"],
            "fields": data["fields"],
            "parameters": {param["name"]: param["value"] for param in data["parameters"]},
        }
        task = run_deduplication_algo(algo_name=algo_name, algo_params=algo_params, user=request.user)

        analyze = EntityDuplicateAnalyzis.objects.create(algorithm=algo_name, metadata=algo_params, task=task)
        analyze.save()

        return Response({"analyze_id": analyze.pk}, status=status.HTTP_201_CREATED)
