from django.db.models import Count
from rest_framework import viewsets
from rest_framework.response import Response
from django.core.paginator import Paginator

from hat.vector_control.models import APIImport


class VectorApiImportViewSet(viewsets.ViewSet):
    """
    API to list api imports of sites for the vector control.

    order:
        parameters:
           order: the order of the imports
    """

    permission_required = [
        'menupermissions.x_vectorcontrol'
    ]
    def list(self, request):
        from_date = request.GET.get("from", None)
        user_ids = request.GET.get("userId", None)
        to_date = request.GET.get("to", None)
        orders = request.GET.get("order", "created_at").split(",")
        limit = int(request.GET.get("limit", 50))
        page_offset = int(request.GET.get("page", 1))
        queryset = APIImport.objects.all().order_by(*orders)
        if from_date is not None:
            queryset = queryset.filter(created_at__date__gte=from_date)
        if to_date is not None:
            queryset = queryset.filter(created_at__date__lte=to_date)
        if user_ids is not None:
            print ('user_ids', user_ids)
            queryset = queryset.filter(user_id__in=user_ids.split(","))
        paginator = Paginator(queryset, limit)

        res = {"count": paginator.count}
        if page_offset > paginator.num_pages:
            page_offset = paginator.num_pages
        page = paginator.page(page_offset)

        res["imports"] = map(lambda x: x.as_dict(), page.object_list)
        res["has_next"] = page.has_next()
        res["has_previous"] = page.has_previous()
        res["page"] = page_offset
        res["pages"] = paginator.num_pages
        res["limit"] = limit

        return Response(res)