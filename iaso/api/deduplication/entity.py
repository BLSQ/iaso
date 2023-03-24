from django.db import models
from django.db.models import Count, F, Q
from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from iaso.api.common import HasPermission, ModelViewSet
from iaso.models import Entity, EntityType


def entity_duplicates(request):
    # Get all entities with the same entity type
    entities = Entity.objects.filter(
        entity_type__in=Entity.objects.values("entity_type")
        .annotate(num=Count("entity_type"))
        .filter(num__gt=1)
        .values("entity_type")
    )

    # Calculate similarity score using NameSim algorithm
    name_similarities = []
    for entity1 in entities:
        for entity2 in entities:
            if entity1.pk != entity2.pk:
                similarity_score = sum(
                    [
                        F("fields_list_view")[i].distance(F("fields_list_view")[i]).cast(models.SmallIntegerField())
                        for i in range(len(entity1.fields_list_view))
                    ]
                ) / len(entity1.fields_list_view)
                if entity1.created_at > entity2.created_at:
                    if not Entity.objects.filter(
                        Q(entity1=entity1, entity2=entity2) | Q(entity1=entity2, entity2=entity1)
                    ).exists():
                        name_similarities.append(
                            {"entity1": entity1.pk, "entity2": entity2.pk, "similarity_score": similarity_score}
                        )

    # Calculate similarity score using Invert algorithm
    invert_similarities = []
    for entity1 in entities:
        for entity2 in entities:
            if entity1.pk != entity2.pk:
                if entity1.fields_list_view == entity2.fields_list_view:
                    similarity_score = (
                        0
                        if entity1.org_unit_id == entity2.org_unit_id
                        else (500 if entity1.parent_org_unit_id == entity2.parent_org_unit_id else 1000)
                    )
                    if entity1.created_at > entity2.created_at:
                        if not Entity.objects.filter(
                            Q(entity1=entity1, entity2=entity2) | Q(entity1=entity2, entity2=entity1)
                        ).exists():
                            invert_similarities.append(
                                {"entity1": entity1.pk, "entity2": entity2.pk, "similarity_score": similarity_score}
                            )

    # Combine results and return response
    results = name_similarities + invert_similarities
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return Response(results)


class EntityDuplicateFilterSet(filters.FilterSet):
    is_duplicate = filters.BooleanFilter(method="filter_is_duplicate")

    class Meta:
        model = Entity
        fields = ["is_duplicate"]

    def filter_is_duplicate(self, queryset, name, value):
        """
        Filter entities by duplicates.
        """
        if value:
            # Get all the entity ids which are duplicates
            duplicate_ids = EntityDuplicate.objects.filter(is_duplicate=True).values_list("entity_id", flat=True)

            # Filter the queryset to only include entities which are duplicates
            queryset = queryset.filter(id__in=duplicate_ids)

        return queryset


class EntityDuplicate(models.Model):
    entity1 = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name="duplicates1")
    entity2 = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name="duplicates2")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("entity1", "entity2")


class EntityDuplicateAnalyze(models.Model):
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name="analyze_duplicates")
    duplicate = models.ForeignKey(EntityDuplicate, on_delete=models.CASCADE, related_name="analyze_results")
    score = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)


class EntityDuplicateAnalyzeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityDuplicateAnalyze
        fields = "__all__"


class EntityDuplicateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityDuplicate
        fields = "__all__"


class EntityDuplicateViewSet(viewsets.ViewSet):
    """Entity Duplicates API
    GET /api/entityduplicates/ : Provides an API to retrieve potentially duplicated entities.
    PATCH /api/entityduplicates/ : Provides an API to merge duplicate entities or to ignore the match
    GET /api/entityduplicates/analyzes : Provides an API to retrieve the list of running and finished analyzes
    GET /api/entityduplicates/analyzes/{id} : Provides an API to retrieve the status of an analyze
    PATCH /api/entityduplicates/analyzes/{id} : Provides an API to change the status of an analyze
    DELETE /api/entityduplicates/analyzes/{id} : Provides an API to delete the possible duplicates of an analyze
    POST /api/entityduplicates/analyzes : Provides an API to launch a duplicate analyzes
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")]  # type: ignore
    serializer_class = EntityDuplicateSerializer

    def list(self, request):
        """
        GET /api/entityduplicates/
        Provides an API to retrieve potentially duplicated entities.
        """
        queryset = EntityDuplicate.objects.all()
        serializer = EntityDuplicateSerializer(queryset, many=True)
        return Response(serializer.data)

    def update(self, request):
        """
        PATCH /api/entityduplicates/
        Provides an API to merge duplicate entities or to ignore the matc
        """
        duplicate = EntityDuplicate.objects.get(pk=pk)
        serializer = EntityDuplicateSerializer(duplicate, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"], url_path="analyzes")
    def analyzes_list(self, request, *args, **kwargs):
        """
        GET /api/entityduplicates/analyzes
        Provides an API to retrieve the list of running and finished analyzes
        """
        pass

    @action(detail=True, methods=["get"], url_path="analyzes")
    def analyzes_detail(self, request, pk=None, *args, **kwargs):
        """
        GET /api/entityduplicates/analyzes/{id}
        Provides an API to retrieve the status of an analyze

        """
        pass

    @action(detail=True, methods=["patch"], url_path="analyzes")
    def analyzes_update(self, request, pk=None, *args, **kwargs):
        """
        PATCH /api/entityduplicates/analyzes/{id}
        Provides an API to change the status of an analyze
        """
        pass

    @action(detail=True, methods=["delete"], url_path="analyzes")
    def analyzes_delete(self, request, pk=None, *args, **kwargs):
        """
        DELETE /api/entityduplicates/analyzes/{id}
        Provides an API to delete the possible duplicates of an analyze
        """
        pass

    @action(detail=False, methods=["post"], url_path="analyzes")
    def analyzes_launch(self, request, *args, **kwargs):
        """
        POST /api/entityduplicates/analyzes
        Provides an API to launch a duplicate analyzes
        """
        pass
