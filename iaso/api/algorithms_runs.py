from rest_framework import viewsets, status
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404

from iaso.models import AlgorithmRun
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class AlgorithmsRunsViewSet(viewsets.ViewSet):
    """
    API list algorithms runs
    Examples:


    GET /api/algorithmsruns/

    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        orders = request.GET.get("order", "created_at").split(",")
        algorithm_id = request.GET.get("algorithmId", None)

        queryset = AlgorithmRun.objects.all()
        if algorithm_id:
            queryset = queryset.filter(algorithm__id=algorithm_id)

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
            return Response(map(lambda x: x.as_dict(), queryset))

    def delete(self, request, pk=None):
        run = get_object_or_404(AlgorithmRun, pk=pk)
        run.delete()
        return Response(True)