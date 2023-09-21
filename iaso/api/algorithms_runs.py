import importlib

from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, exceptions
from rest_framework.response import Response

from iaso.models import AlgorithmRun, DataSource, SourceVersion, MatchingAlgorithm
from hat.menupermissions import models as permission


class AlgorithmsRunsViewSet(viewsets.ViewSet):
    f"""Algorithms runs API

    This API is restricted to authenticated users having the "{permission.LINKS}" permission

    GET /api/algorithmsruns/
    GET /api/algorithmsruns/<id>
    PUT /api/algorithmsruns/<id>
    DELETE /api/algorithmsruns/<id>
    """

    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        orders = request.GET.get("order", "created_at").split(",")
        algorithm_id = request.GET.get("algorithmId", None)
        origin = request.GET.get("origin", None)
        destination = request.GET.get("destination", None)
        origin_version = request.GET.get("originVersion", None)
        destination_version = request.GET.get("destinationVersion", None)
        launcher_id = request.GET.get("launcher", None)

        queryset = AlgorithmRun.objects.all()

        profile = request.user.iaso_profile
        sources = DataSource.objects.filter(projects__account=profile.account).distinct()
        queryset = queryset.filter(version_1__data_source__in=sources)
        queryset = queryset.filter(version_2__data_source__in=sources)

        if algorithm_id:
            queryset = queryset.filter(algorithm__id=algorithm_id)
        if origin:
            queryset = queryset.filter(version_2__data_source__id=origin)
        if destination:
            queryset = queryset.filter(version_1__data_source__id=destination)
        if origin_version:
            queryset = queryset.filter(version_2__number=origin_version)
        if destination_version:
            queryset = queryset.filter(version_1__number=destination_version)
        if launcher_id:
            queryset = queryset.filter(launcher=launcher_id)

        queryset = queryset.order_by(*orders)

        if limit:
            limit = int(limit)
            page_offset = int(page_offset)

            paginator = Paginator(queryset, limit)
            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["runs"] = map(lambda x: x.as_dict(), page.object_list)
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit
            return Response(res)
        else:
            return Response(map(lambda x: x.as_list(), queryset))

    def create(self, request):
        algo_id = request.data.get("algo")
        version_1 = request.data.get("destination")
        version_2 = request.data.get("source")
        launcher = self.request.user
        profile = self.request.user.iaso_profile
        sources = DataSource.objects.filter(projects__account=profile.account).distinct()

        v1 = SourceVersion.objects.get(id=version_1)
        v2 = SourceVersion.objects.get(id=version_2)

        if v1.data_source not in sources or v2.data_source not in sources:
            raise exceptions.PermissionDenied()

        run = AlgorithmRun(algorithm_id=algo_id, version_1=v1, version_2=v2, launcher=launcher)
        run.save()
        return Response(run.as_dict())

    def retrieve(self, request, pk=None):
        run_item = get_object_or_404(AlgorithmRun, pk=pk)
        return Response(run_item.as_dict())

    def delete(self, request, pk=None):
        run_item = get_object_or_404(AlgorithmRun, pk=pk)
        run_item.delete()
        return Response(True)

    def update(self, request, pk=None):
        algo_id = request.data.get("algoId", -1)
        source_origin_id = request.data.get("sourceOriginId", -1)
        version_origin = request.data.get("versionOrigin", -1)
        source_destination_id = request.data.get("sourceDestinationId", -1)
        version_destination = request.data.get("versionDestination", -1)

        algorithm = MatchingAlgorithm.objects.get(id=algo_id)
        source_1 = DataSource.objects.get(id=source_origin_id)
        version_1 = SourceVersion.objects.get(number=version_origin, data_source=source_1)
        source_2 = DataSource.objects.get(id=source_destination_id)
        version_2 = SourceVersion.objects.get(number=version_destination, data_source=source_2)
        algo_module = importlib.import_module(algorithm.name)
        algo = algo_module.Algorithm()
        algo.match(version_1, version_2, request.user)
        return Response(True)
