from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import Form, Instance
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404


class FormsViewSet(viewsets.ViewSet):
    """
    API to allow retrieval of forms.

    """

    authentication_classes = []
    permission_classes = []

    def list(self, request):
        queryset = Form.objects.order_by("id")
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        orders = request.GET.get("order", "updated_at").split(",")

        queryset = queryset.order_by(*orders)

        if limit:
            limit = int(limit)
            page_offset = int(page_offset)

            paginator = Paginator(queryset, limit)
            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["forms"] = map(lambda x: x.as_dict(), page.object_list)
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit
            return Response(res)
        else:
            return Response({"forms": [form.as_dict() for form in queryset]})

    def retrieve(self, request, pk=None):
        form = get_object_or_404(Form, pk=pk)
        res = form.as_dict()
        return Response(res)