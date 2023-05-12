import math
from django.contrib.auth.models import User
from django.db import models
from django.db.models import Count, F, Q
from django.http import JsonResponse
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_yasg import openapi
from drf_yasg.utils import no_body, swagger_auto_schema
from rest_framework import mixins, permissions, serializers, status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter
from rest_framework.request import Request
from uuid import UUID

import iaso.models.base as base
from iaso.api.common import HasPermission, Paginator
from iaso.api.workflows.serializers import find_question_by_name
from iaso.models import Entity, EntityDuplicate, EntityDuplicateAnalyze, EntityType, Form, Task
from iaso.tasks.run_deduplication_algo import run_deduplication_algo
from iaso.tests.api.workflows.base import var_dump

from .algos import POSSIBLE_ALGORITHMS, run_algo
from .common import PotentialDuplicate
from iaso.models.deduplication import PENDING, VALIDATED, IGNORED


class EntityDuplicateNestedFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = ["id", "name"]


class EntityDuplicateNestedEntityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityType
        fields = ["id", "name"]


class EntityDuplicatedNestedOrgunitSerializer(serializers.ModelSerializer):
    class Meta:
        model = base.OrgUnit
        fields = ["id", "name"]


class EntityDuplicatedNestedEntitySerializer(serializers.ModelSerializer):
    org_unit = EntityDuplicatedNestedOrgunitSerializer(source="attributes.org_unit")
    json = serializers.DictField(source="attributes.json")

    class Meta:
        model = Entity
        fields = ["id", "created_at", "updated_at", "org_unit", "json"]


class EntityDuplicateNestedAnalyzisSerializer(serializers.ModelSerializer):
    analyze_id = serializers.IntegerField(source="id")
    type = serializers.CharField(source="algorithm")
    the_fields = serializers.SerializerMethodField()

    def get_the_fields(self, obj):
        return obj.metadata["fields"]

    class Meta:
        model = EntityDuplicateAnalyze
        fields = ["analyze_id", "created_at", "finished_at", "the_fields", "type"]


# credit https://stackoverflow.com/questions/53847404/how-to-check-uuid-validity-in-python
def is_UUID(value, version=4):
    if isinstance(value, str):
        return False
    try:
        uuid_obj = UUID(value, version=version)
    except ValueError:
        return False
    return str(uuid_obj) == value


class EntityDuplicateSerializer(serializers.ModelSerializer):
    entity_type = EntityDuplicateNestedEntityTypeSerializer(source="entity1.entity_type")
    form = EntityDuplicateNestedFormSerializer(source="entity1.entity_type.reference_form")
    the_fields = serializers.SerializerMethodField()
    entity1 = EntityDuplicatedNestedEntitySerializer()
    entity2 = EntityDuplicatedNestedEntitySerializer()
    analyzis = serializers.SerializerMethodField()
    similarity = serializers.SerializerMethodField()
    similarity_star = serializers.SerializerMethodField()
    ignored = serializers.SerializerMethodField()
    ignored_reason = serializers.SerializerMethodField()

    def get_analyzis(self, obj):
        return [EntityDuplicateNestedAnalyzisSerializer(obj.analyze).data]

    def get_ignored(self, obj):
        return obj.validation_status == IGNORED

    def get_ignored_reason(self, obj):
        if "ignored_reason" in obj.metadata:
            return obj.metadata["ignored_reason"]
        else:
            return ""

    def get_similarity(self, obj):
        return obj.similarity_score

    def get_similarity_star(self, obj):
        return math.floor(obj.similarity_score / 20.0)

    def get_the_fields(self, obj):
        the_fields = obj.analyze.metadata["fields"]

        ret_val = []
        etype = obj.entity1.entity_type
        ref_form = etype.reference_form
        possible_fields = ref_form.possible_fields

        for f in the_fields:
            the_q = find_question_by_name(f, possible_fields)
            ret_val.append({"field": the_q["name"], "label": the_q["label"]})

        return ret_val

    class Meta:
        model = EntityDuplicate
        fields = [
            "id",
            "entity_type",
            "form",
            "the_fields",
            "entity1",
            "entity2",
            "analyzis",
            "similarity",
            "similarity_star",
            "ignored",
            "ignored_reason",
        ]


class EntityDuplicatePostSerializer(serializers.Serializer):
    entity1_id = serializers.IntegerField(required=True)
    entity2_id = serializers.IntegerField(required=True)
    merge = serializers.DictField(child=serializers.IntegerField(), required=False)
    ignore = serializers.BooleanField(required=False, default=False)
    reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, data):
        if data["entity1_id"] == data["entity2_id"]:
            raise serializers.ValidationError("Entities 1 and 2 must be different")

        try:
            entity1 = Entity.objects.get(pk=data["entity1_id"])
        except Entity.DoesNotExist:
            raise serializers.ValidationError("Entity 1 does not exist")

        try:
            entity2 = Entity.objects.get(pk=data["entity2_id"])
        except Entity.DoesNotExist:
            raise serializers.ValidationError("Entity 2 does not exist")

        if entity1.entity_type != entity2.entity_type:
            raise serializers.ValidationError("Entities must be of the same type")

        if data["ignore"] and data["reason"] == "":
            print("Ignore the duplicate but no reason provided")

        else:  # merge the duplicates
            etype = entity1.entity_type
            ref_form = etype.reference_form
            possible_fields = ref_form.possible_fields

            for kk, vv in data["merge"]:
                if vv != data["entity1_id"] and vv != data["entity2_id"]:
                    raise serializers.ValidationError("The merge must be done with one of the two entities")

                the_q = find_question_by_name(kk, possible_fields)

                if the_q is None:
                    raise serializers.ValidationError(f"Question {kk} does not exist in the reference form")

        return data

    def create(self, validated_data):
        pass


duplicate_detail_entities_param = openapi.Parameter(
    name="entities",
    in_=openapi.IN_QUERY,
    description="Comma separeted list of 2 entities ids to to retrieve the duplicate about",
    type=openapi.TYPE_STRING,
    required=True,
)


class EntityDuplicateViewSet(viewsets.GenericViewSet):
    """Entity Duplicates API
    GET /api/entityduplicates/ : Provides an API to retrieve potentially duplicated entities.
    GET /api/entityduplicates/<pk>/ : Provides an API to retrieve details about a potential duplicate
    POST /api/entityduplicates/ : Provides an API to merge duplicate entities or to ignore the match
    """

    filter_backends = [
        OrderingFilter,
        DjangoFilterBackend,
    ]

    ordering_fields = ["created_at", "similarity_score", "id"]
    remove_results_key_if_paginated = False
    results_key = "results"
    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_entity_duplicates_read")]  # type: ignore
    serializer_class = EntityDuplicateSerializer
    results_key = "results"
    model = EntityDuplicate
    pagination_class = Paginator

    def get_results_key(self):
        return self.results_key

    def list(self, request: Request, *args, **kwargs):
        # """Override to return responses with {"result_key": data} structure"""
        entity_id = self.request.GET.get("entity_id", None)
        queryset = self.filter_queryset(self.get_queryset())
        if entity_id:
            queryset = queryset.filter(Q(entity1__id=entity_id) | Q(entity2__id=entity_id))

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        if not self.remove_results_key_if_paginated:
            return Response(data={self.get_results_key(): serializer.data}, content_type="application/json")
        else:
            return Response(data=serializer.data, content_type="application/json")

    def get_queryset(self):
        entities = self.request.query_params.get("entities", None)

        initial_queryset = EntityDuplicate.objects.all()

        if entities is not None:
            entities_arr = entities.split(",")

            if len(entities_arr) != 2:
                raise serializers.ValidationError("You must provide two entities to compare")

            initial_queryset = initial_queryset.filter(
                Q(entity1=entities_arr[0], entity2=entities_arr[1])
                | Q(entity2=entities_arr[0], entity1=entities_arr[1])
            )

        return initial_queryset

    @swagger_auto_schema(manual_parameters=[duplicate_detail_entities_param])
    @action(detail=False, methods=["get"], url_path="detail", pagination_class=None, filter_backends=[])
    def detail_view(self, request):
        """
        GET /api/entityduplicates/detail/?entities=A,B
        Provides an API to retrieve details about a potential duplicate
        For all the 'fields' of the analyzis it will return
        {
        "the_field": {
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
            duplicate = self.get_queryset().first()
        except:
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

        fields_data = []

        possible_fields = et.reference_form.possible_fields

        e1_json = duplicate.entity1.attributes.json
        e2_json = duplicate.entity2.attributes.json

        for the_q in possible_fields:

            try:
                e1_val = e1_json[the_q["name"]]
                # FIXME: find a better way to exclude the instance id
                if "uuid" in e1_val:
                    continue
                if is_UUID(e1_val):
                    continue
                e1_type = type(e1_val).__name__
            except:
                e1_val = "Not Found"
                e1_type = "Not Found"

            try:
                e2_val = e2_json[the_q["name"]]
                e2_type = type(e2_val).__name__
            except:
                e2_val = "Not Found"
                e2_type = "Not Found"

            fields_data.append(
                {
                    "the_field": {
                        "field": the_q["name"],
                        "label": the_q["label"],
                    },
                    "entity1": {
                        "value": e1_val,
                        "id": duplicate.entity1.id,
                    },
                    "entity2": {
                        "value": e2_val,
                        "id": duplicate.entity2.id,
                    },
                    "final": {
                        "value": e1_val if e1_val == e2_val else "",  # this needs to be fixed !
                        "id": duplicate.entity1.id,  # this needs to be fixed !
                    },
                }
            )

        version1 = duplicate.entity1.attributes.get_form_version()
        version2 = duplicate.entity2.attributes.get_form_version()

        return_data = {
            "fields": fields_data,
            "descriptor1": version1.get_or_save_form_descriptor(),
            "descriptor2": version2.get_or_save_form_descriptor(),
        }

        return JsonResponse(return_data, safe=False)

    @swagger_auto_schema(request_body=EntityDuplicatePostSerializer(many=True))
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
            "status": "ignored",
            "reason": "optional reason"
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
