from django.contrib.auth.models import User
from django.db import models
from django.db.models import Count, F, Q
from django.http import JsonResponse
from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_yasg import openapi
from drf_yasg.utils import no_body, swagger_auto_schema
from rest_framework import mixins, permissions, serializers, status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

import iaso.models.base as base
from iaso.api.common import HasPermission, ModelViewSet, Paginator
from iaso.models import Entity, EntityDuplicate, EntityDuplicateAnalyze, EntityType, Form, Task
from iaso.tasks.run_deduplication_algo import run_deduplication_algo
from iaso.api.workflows.serializers import find_question_by_name

from .algos import POSSIBLE_ALGORITHMS, run_algo
from .common import PotentialDuplicate


class EntityDuplicateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityDuplicate
        fields = "__all__"


class EntityDuplicateViewSet(viewsets.ViewSet):
    """Entity Duplicates API
    GET /api/entityduplicates/ : Provides an API to retrieve potentially duplicated entities.
    PATCH /api/entityduplicates/ : Provides an API to merge duplicate entities or to ignore the match
    """

    # filter_backends = [
    # filters.OrderingFilter,
    # DjangoFilterBackend,
    # ]

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_entity_duplicates_read")]  # type: ignore
    serializer_class = EntityDuplicateSerializer
    results_key = "results"

    def get_queryset(self):
        return EntityDuplicate.objects.all()

    # Copied from common.py
    def pagination_class(self):
        return Paginator(self.results_key)

    def list(self, request, *args, **kwargs):
        """
        GET /api/entityduplicates/
        Provides an API to retrieve potentially duplicated entities.
        """
        queryset = EntityDuplicate.objects.all()
        # TO DO restore when filters are set up
        # queryset = self.filter_queryset(queryset)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = self.serializer_class(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        serializer = EntityDuplicateSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="detail")
    def detail_view(self, request, pk):
        """
        GET /api/entityduplicates/<pk>/detail
        Provides an API to retrieve details about a potential duplicate
        For all the 'fields' of the analyzis it will return
        {
        "field": {
            "field": string, // The key of the field
            label: string | { "English": string, "French":string } // either a string or an object with the translations
            },
        "entity1":{
            "value":string | number| boolean, // I think the value types cover what we can expect
            "id": int // The id of the entity
            },
        "entity2":{
            "value":string |number|boolean,
            "id": int
            }
        "final":{
            "value"?:string |number|boolean, // No value if the entities mismatch
            "id"?: int // The value of the entity it was taken from
            }
        }
        So basically it returns an array of those objects
        """
        try:
            duplicate = EntityDuplicate.objects.get(pk=pk)
        except EntityDuplicate.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"error": "entity duplicate not found"})

        # we need to create the expected answer from all the fields
        # we need to get the fields from the analyze
        analyze = duplicate.analyze
        fields = analyze.metadata["fields"]
        entity_type_id = analyze.metadata["entity_type_id"]

        try:
            et = EntityType.objects.get(pk=int(entity_type_id))
        except EntityType.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"error": "entitytype not found"})

        return_data = []

        possible_fields = et.reference_form.possible_fields

        e1_json = duplicate.entity1.attributes.json
        e2_json = duplicate.entity2.attributes.json

        for f in fields:

            the_q = find_question_by_name(f, possible_fields)

            # needs to handle the case where the field is not found
            e1_val = e1_json[the_q["name"]]
            e1_type = type(e1_val).__name__

            e2_val = e2_json[the_q["name"]]
            e2_type = type(e2_val).__name__

            return_data.append(
                {
                    "field": {
                        "field": the_q["name"],
                        "label": the_q["label"],
                    },
                    "entity1": {
                        "value": e1_type,
                        "id": duplicate.entity1.id,
                    },
                    "entity2": {
                        "value": e2_type,
                        "id": duplicate.entity2.id,
                    },
                    "final": {
                        "value": e1_type,  # this needs to be fixed !
                        "id": duplicate.entity1.id,  # this needs to be fixed !
                    },
                }
            )

        return JsonResponse(return_data, safe=False)

    def create(self, request, pk=None, *args, **kwargs):
        """
        POST /api/entityduplicates/
        one or multiple
        [{
            "entity1_id": Int,
            "entity2_id": Int,
            "merge": {
                "key1": "entity1_id",
                "key2": "entity1_id",
                "key3": "entity2_id",
                ...
            }
            "status": "ignored"
        }]
        in the body
        Provides an API to merge duplicate entities or to ignore the match
        """
        pass


def field_exists(f: Form, field_name: str) -> bool:
    try:
        for f in f.possible_fields:
            if f["name"] == field_name:
                return True

        return False
    except:
        return False


class AnalyzePostBodySerializer(serializers.Serializer):
    algorithm = serializers.ChoiceField(choices=POSSIBLE_ALGORITHMS)
    entity_type_id = serializers.CharField()
    fields = serializers.ListField(child=serializers.CharField())
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
    fields = serializers.SerializerMethodField(method_name="get_the_fields")
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


class EntityDuplicateAnalyzeViewSet(viewsets.ViewSet):
    """Entity Duplicates API
    GET /api/entityduplicates/analyzes : Provides an API to retrieve the list of running and finished analyzes
    POST /api/entityduplicates/analyzes : Provides an API to launch a duplicate analyzes
    GET /api/entityduplicates/analyzes/{id} : Provides an API to retrieve the status of an analyze
    PATCH /api/entityduplicates/analyzes/{id} : Provides an API to change the status of an analyze
    DELETE /api/entityduplicates/analyzes/{id} : Provides an API to delete the possible duplicates of an analyze

    """

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_entity_duplicates_read")]  # type: ignore
    serializer_class = EntityDuplicateAnalyzeSerializer

    def list(self, request, *args, **kwargs):
        """
        GET /api/entityduplicates_analyzes/
        Provides an API to retrieve the list of running and finished analyzes
        """
        queryset = EntityDuplicateAnalyze.objects.all()
        serializer = EntityDuplicateAnalyzeSerializer(queryset, many=True)
        return Response(serializer.data)

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
            "algorithm": "namesim", "invert" //See [Algorithms]
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
