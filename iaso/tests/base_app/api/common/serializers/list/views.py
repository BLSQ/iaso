from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer
from rest_framework.viewsets import GenericViewSet

from .models import TestModelForListQueryOptimizedSerializer
from .serializers import (
    ClassicDRFPkOptimizedListSerializer,
    ClassicDRFPkSerializer,
    ClassicDRFSlugOptimizedListSerializer,
    ClassicDRFSlugSerializer,
    OptimizedDRFPkOptimizedListSerializer,
    OptimizedDRFPkSerializer,
    OptimizedDRFSlugOptimizedListSerializer,
    OptimizedDRFSlugSerializer,
)


class TestPKRelatedViewSet(GenericViewSet):
    authentication_classes = []
    permission_classes = []
    queryset = TestModelForListQueryOptimizedSerializer.objects.all()

    def get_serializer_class(self) -> type[BaseSerializer]:
        serializers_by_action = {
            "create_single_classic_drf_pk_serializer": ClassicDRFPkSerializer,
            "create_single_optimized_drf_pk_serializer": OptimizedDRFPkSerializer,
            "create_multiple_classic_drf_pk_serializers_with_classic_list_serializer": ClassicDRFPkSerializer,
            "create_multiple_optimized_drf_pk_serializers_with_classic_list_serializer": OptimizedDRFPkSerializer,
            "create_multiple_classic_drf_pk_serializers_with_optimized_list_serializer": ClassicDRFPkOptimizedListSerializer,
            "create_multiple_optimized_drf_pk_serializers_with_optimized_list_serializer": OptimizedDRFPkOptimizedListSerializer,
        }
        return serializers_by_action[self.action]

    def _create(self, request, many=False, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data, many=many)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="single-classic", url_name="single-classic")
    def create_single_classic_drf_pk_serializer(self, request, *args, **kwargs):
        return self._create(request, *args, **kwargs)

    @action(detail=False, methods=["post"], url_path="single-optimized", url_name="single-optimized")
    def create_single_optimized_drf_pk_serializer(self, request, *args, **kwargs):
        return self._create(request, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-classic-list-classic",
        url_name="multiple-classic-list-classic",
    )
    def create_multiple_classic_drf_pk_serializers_with_classic_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-optimized-list-classic",
        url_name="multiple-optimized-list-classic",
    )
    def create_multiple_optimized_drf_pk_serializers_with_classic_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-classic-list-optimized",
        url_name="multiple-classic-list-optimized",
    )
    def create_multiple_classic_drf_pk_serializers_with_optimized_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-optimized-list-optimized",
        url_name="multiple-optimized-list-optimized",
    )
    def create_multiple_optimized_drf_pk_serializers_with_optimized_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)


class TestSlugRelatedViewSet(GenericViewSet):
    authentication_classes = []
    permission_classes = []
    queryset = TestModelForListQueryOptimizedSerializer.objects.all()

    def get_serializer_class(self) -> type[BaseSerializer]:
        serializers_by_action = {
            "create_single_classic_drf_slug_serializer": ClassicDRFSlugSerializer,
            "create_single_optimized_drf_slug_serializer": OptimizedDRFSlugSerializer,
            "create_multiple_classic_drf_slug_serializers_with_classic_list_serializer": ClassicDRFSlugSerializer,
            "create_multiple_optimized_drf_slug_serializers_with_classic_list_serializer": OptimizedDRFSlugSerializer,
            "create_multiple_classic_drf_slug_serializers_with_optimized_list_serializer": ClassicDRFSlugOptimizedListSerializer,
            "create_multiple_optimized_drf_slug_serializers_with_optimized_list_serializer": OptimizedDRFSlugOptimizedListSerializer,
        }
        return serializers_by_action[self.action]

    def _create(self, request, many=False, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data, many=many)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="single-classic", url_name="single-classic")
    def create_single_classic_drf_slug_serializer(self, request, *args, **kwargs):
        return self._create(request, *args, **kwargs)

    @action(detail=False, methods=["post"], url_path="single-optimized", url_name="single-optimized")
    def create_single_optimized_drf_slug_serializer(self, request, *args, **kwargs):
        return self._create(request, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-classic-list-classic",
        url_name="multiple-classic-list-classic",
    )
    def create_multiple_classic_drf_slug_serializers_with_classic_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-optimized-list-classic",
        url_name="multiple-optimized-list-classic",
    )
    def create_multiple_optimized_drf_slug_serializers_with_classic_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-classic-list-optimized",
        url_name="multiple-classic-list-optimized",
    )
    def create_multiple_classic_drf_slug_serializers_with_optimized_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-optimized-list-optimized",
        url_name="multiple-optimized-list-optimized",
    )
    def create_multiple_optimized_drf_slug_serializers_with_optimized_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)
