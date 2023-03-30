from django.db import models
from django.db.models import Count, F, Q
from django.http import JsonResponse
from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_yasg import openapi
from drf_yasg.utils import no_body, swagger_auto_schema
from rest_framework import mixins, serializers, status, viewsets, permissions
from rest_framework.decorators import action, api_view
from rest_framework.response import Response


from iaso.api.common import HasPermission, ModelViewSet
from iaso.models import Form, Entity, EntityType, EntityDuplicate, EntityDuplicateAnalyze
from iaso.tasks.run_deduplication_algo import run_deduplication_algo

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

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")]  # type: ignore
    serializer_class = EntityDuplicateSerializer

    def list(self, request, *args, **kwargs):
        """
        GET /api/entityduplicates/
        Provides an API to retrieve potentially duplicated entities.
        """
        queryset = EntityDuplicate.objects.all()
        serializer = EntityDuplicateSerializer(queryset, many=True)
        return Response(serializer.data)

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


class EntityDuplicateAnalyzeViewSet(viewsets.ViewSet):
    """Entity Duplicates API
    GET /api/entityduplicates/analyzes : Provides an API to retrieve the list of running and finished analyzes
    POST /api/entityduplicates/analyzes : Provides an API to launch a duplicate analyzes
    GET /api/entityduplicates/analyzes/{id} : Provides an API to retrieve the status of an analyze
    PATCH /api/entityduplicates/analyzes/{id} : Provides an API to change the status of an analyze
    DELETE /api/entityduplicates/analyzes/{id} : Provides an API to delete the possible duplicates of an analyze

    """

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")]  # type: ignore
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
        GET /api/entityduplicates_analyzes/{id}
        Provides an API to retrieve the status of an analyze

        """
        try:
            obj = EntityDuplicateAnalyze.objects.get(pk=pk)

        except EntityDuplicateAnalyze.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = EntityDuplicateAnalyzeSerializer(obj)
        return Response(serializer.data)

    def partial_update(self, request, pk=None, *args, **kwargs):
        """
        PATCH /api/entityduplicates_analyzes/{id}
        Provides an API to change the status of an analyze
        """
        pass

    def destroy(self, request, pk=None, *args, **kwargs):
        """
        DELETE /api/entityduplicates_analyzes/{id}
        Provides an API to delete the possible duplicates of an analyze
        """
        pass

    @swagger_auto_schema(
        request_body=AnalyzePostBodySerializer,
    )
    def create(self, request, *args, **kwargs):
        """
        POST /api/entityduplicates/analyzes
        example body:
        {
            "algorithm": "namesim", "invert"
            "entity_type_id": String,
            "fields": String[],
            "parameters": {},
        }
        Provides an API to launch a duplicate analyzes
        """

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
