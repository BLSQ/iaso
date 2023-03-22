from django.db import models
from django.db.models import Count, F, Q
from django_filters import rest_framework as filters
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

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


class EntityDuplicateViewSet(mixins.ListModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    queryset = EntityDuplicate.objects.all()
    serializer_class = EntityDuplicateSerializer
    filterset_class = EntityDuplicateFilterSet
    filterset_fields = [
        "entity_type",
        "org_unit",
        "start_date",
        "end_date",
        "search",
        "submitter",
        "submitter_team",
        "ignored",
        "entities",
        "fields",
        "analyze_id",
    ]
    ordering_fields = ["created_at", "similarity"]
    ordering = ["-created_at"]

    def get_paginated_response(self, data):
        return Response(
            {
                "pagination": {
                    "page": self.paginator.page.number,
                    "page_size": self.paginator.page_size,
                    "total_pages": self.paginator.num_pages,
                    "total_items": self.paginator.count,
                },
                "results": data,
            }
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.request.query_params.get("page", 1)
        limit = self.request.query_params.get("limit", 1000)
        similarity = self.request.query_params.get("similarity", 250)
        paginator = self.pagination_class()
        paginator.page_size = limit
        queryset = queryset.filter(similarity__lte=similarity)
        page_queryset = paginator.paginate_queryset(queryset, request)
        serializer = self.get_serializer(page_queryset, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=["patch"])
    def merge(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = self.get_object()
        instance.merge(serializer.validated_data)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=["patch"])
    def ignore(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = self.get_object()
        instance.ignore(serializer.validated_data.get("reason", None))
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class EntityDuplicateAnalyzeViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = EntityDuplicateAnalyze.objects.all()
    serializer_class = EntityDuplicateAnalyzeSerializer
    filter_backends = [filters.DjangoFilterBackend]
    filterset_fields = [
        "algorithm",
        "entity_type_id",
        "start_date",
        "end_date",
        "submitter",
        "submitter_team",
        "fields",
    ]

    @action(detail=True, methods=["delete"])
    def delete_duplicates(self, request, pk=None):
        instance = self.get_object()
        instance.delete_duplicates()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"])
    def launch(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(created_by=request.user)
        return Response({"analyze_id": instance.pk}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"])
    def merge(self, request, pk=None):
        instance = self.get_object()
        instance.merge()
        return Response(status=status.HTTP_204_NO_CONTENT)
