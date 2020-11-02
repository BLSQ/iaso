from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response


from hat.audit.models import Modification
from hat.api.authentication import CsrfExemptSessionAuthentication


class LogsViewSet(viewsets.ViewSet):
    """
    Modification API to retrieve log modifications.

    list:
    Returns the list of modifications

    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def list(self, request):
        from_date = request.GET.get("date_from", None)
        to_date = request.GET.get("date_to", None)
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        orders = request.GET.get("order", "created_at").split(",")
        user_ids = request.GET.get("userId", None)
        object_id = request.GET.get("objectId", None)
        source = request.GET.get("source", None)

        queryset = Modification.objects.all()

        if from_date is not None:
            queryset = queryset.filter(created_at__gte=from_date)
        if to_date is not None:
            queryset = queryset.filter(created_at__lte=to_date)
        if user_ids is not None:
            queryset = queryset.filter(user_id__in=user_ids.split(","))
        if object_id is not None:
            queryset = queryset.filter(object_id=object_id)
        if source is not None:
            queryset = queryset.filter(source=source)

        queryset = queryset.order_by(*orders)

        if limit:
            limit = int(limit)
            page_offset = int(page_offset)

            paginator = Paginator(queryset, limit)
            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["list"] = map(lambda x: x.as_list(), page.object_list)
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit
            return Response(res)
        else:
            return Response(map(lambda x: x.as_list(), queryset))

    def retrieve(self, request, pk=None):
        log = get_object_or_404(Modification, pk=pk)
        return Response(log.as_dict())
