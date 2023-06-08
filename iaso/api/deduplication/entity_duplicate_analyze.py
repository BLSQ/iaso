from django.contrib.auth.models import User
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, permissions, serializers, status, viewsets
from rest_framework.response import Response

import iaso.models.base as base
from iaso.api.common import HasPermission, Paginator
from iaso.models import Entity, EntityDuplicateAnalyze, EntityType, Form
from iaso.tasks.run_deduplication_algo import run_deduplication_algo

from .algos import POSSIBLE_ALGORITHMS  # type: ignore


def field_exists(f: Form, field_name: str) -> bool:
    try:
        for field in f.possible_fields:
            if field["name"] == field_name:
                return True

        return False
    except:
        return False


class AnalyzePostBodySerializer(serializers.Serializer):
    algorithm = serializers.ChoiceField(choices=POSSIBLE_ALGORITHMS)
    entity_type_id = serializers.CharField()
    fields = serializers.ListField(child=serializers.CharField())  # type: ignore
    parameters = serializers.DictField()

    def validate(self, data):
        data = super().validate(data)

        try:
            e_type = EntityType.objects.get(pk=data["entity_type_id"])
        except Entity.DoesNotExist:
            raise serializers.ValidationError(f"Entity type does not exist")

        for f_name in data["fields"]:
            if not field_exists(e_type.reference_form, f_name):
                raise serializers.ValidationError(f"Field {f_name} does not exist on reference form")

        return data


class EntityDuplicateAnalyzeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityDuplicateAnalyze
        fields = "__all__"


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = ["id", "username"]


class EntityDuplicateAnalyzeDetailSerializer(serializers.ModelSerializer):
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
        model = EntityDuplicateAnalyze
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


class EntityDuplicateAnalyzeViewSet(viewsets.GenericViewSet):
    """Entity Duplicates API
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
    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_entity_duplicates_read")]  # type: ignore
    serializer_class = EntityDuplicateAnalyzeSerializer
    pagination_class = Paginator

    def get_results_key(self):
        return self.results_key

    def get_queryset(self):
        initial_queryset = EntityDuplicateAnalyze.objects.all()
        return initial_queryset

    def list(self, request, *args, **kwargs):
        """
        GET /api/entityduplicates_analyzes/
        Provides an API to retrieve the list of running and finished analyzes
        """
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = EntityDuplicateAnalyzeSerializer(queryset, many=True)
        if not self.remove_results_key_if_paginated:
            return Response(data={self.get_results_key(): serializer.data}, content_type="application/json")
        else:
            return Response(data=serializer.data, content_type="application/json")

    def retrieve(self, request, pk=None, *args, **kwargs):
        """
        GET /api/entityduplicates_analyzes/{id}/
        Provides an API to retrieve the status of an analyze

        ## Possible responses

        ### 200 - OK

        ```javascript
        {
            "id": Int,
            "status": "queued", "running", "failed", "success", "canceled",
            "started_at": DateTime?,
            "created_by": {}, // simple user object
            "algorithm": "namesim", "invert", "levenshtein" //See [Algorithms]
            "entity_type_id": String,
            "fields": String[],
            "parameters": {}, // dictionary
            "finished_at": DateTime?,
            "created_at": DateTime,
            "updated_at": DateTime,
        }
        ```


        ### 401 - Unauthorized

        The user has not provided a correct authentication token

        ### 403 - Forbidden

        The user has provided a correct authentication token with insufficient rights

        ### 404 - Not found

        - When the provided `id` is not found

        """
        try:
            obj = EntityDuplicateAnalyze.objects.get(pk=pk)

        except EntityDuplicateAnalyze.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = EntityDuplicateAnalyzeDetailSerializer(obj)
        return Response(serializer.data)

    def partial_update(self, request, pk=None, *args, **kwargs):
        """
        PATCH /api/entityduplicates_analyzes/{id}/
        Provides an API to change the status of an analyze
        Send {"status": "QUEUED"} or {"status": "KILLED"} to change the status of the analyze
        Only allowed transitions are "KILLED" -> "QUEUED" and "QUEUED", "RUNNING" -> "KILLED"
        Needs iaso_entity_duplicates_write permission
        """

        if not request.user.has_perm("menupermissions.iaso_entity_duplicates_write"):
            return Response(status=status.HTTP_403_FORBIDDEN)

        try:
            eda = EntityDuplicateAnalyze.objects.get(pk=pk)
        except:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if eda.task.status == base.KILLED and request.data["status"] == base.QUEUED:
            eda.task.status = base.QUEUED
            eda.task.save()
            return Response(status=status.HTTP_200_OK)

        elif eda.task.status in [base.QUEUED, base.RUNNING] and request.data["status"] == base.KILLED:
            eda.task.status = base.KILLED
            eda.task.save()
            return Response(status=status.HTTP_200_OK)

        else:
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
        if not request.user.has_perm("menupermissions.iaso_entity_duplicates_write"):
            return Response(status=status.HTTP_403_FORBIDDEN)

        try:
            obj = EntityDuplicateAnalyze.objects.get(pk=pk)

        except EntityDuplicateAnalyze.DoesNotExist:
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

        if not request.user.has_perm("menupermissions.iaso_entity_duplicates_write"):
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = AnalyzePostBodySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        algo_name = data["algorithm"]
        algo_params = {
            "entity_type_id": data["entity_type_id"],
            "fields": data["fields"],
            "parameters": data["parameters"],
        }

        the_task = run_deduplication_algo(algo_name=algo_name, algo_params=algo_params, user=request.user)

        # Create an EntityDuplicateAnalyze object
        analyze = EntityDuplicateAnalyze.objects.create(algorithm=algo_name, metadata=algo_params, task=the_task)
        analyze.save()

        return Response({"analyze_id": analyze.pk}, status=status.HTTP_201_CREATED)
