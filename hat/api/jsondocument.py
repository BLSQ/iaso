from django.core.paginator import Paginator
from rest_framework import viewsets, status, request
from rest_framework.authentication import BasicAuthentication
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from hat.api.authentication import CsrfExemptSessionAuthentication
from hat.sync.models import JSONDocument


class JSONDocumentViewSet(viewsets.ViewSet):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = ["menupermissions.x_locator", "menupermissions.x_case_cases"]

    def list(self, request):
        limit = int(request.GET.get("limit", 50))
        page_offset = int(request.GET.get("page", 1))

        case_id = request.GET.get("case_id", None)
        full = request.GET.get("full", "false").lower() == "true"
        if case_id is None:
            return Response("Please specify a case_id", status.HTTP_400_BAD_REQUEST)

        queryset = JSONDocument.objects.filter(case_id=case_id).order_by("-id")

        paginator = Paginator(queryset, limit)

        res = {"count": paginator.count}
        if page_offset > paginator.num_pages:
            page_offset = paginator.num_pages
        page = paginator.page(page_offset)

        res["cases"] = (x.as_dict(full=full) for x in page.object_list)
        res["has_next"] = page.has_next()
        res["has_previous"] = page.has_previous()
        res["page"] = page_offset
        res["pages"] = paginator.num_pages
        res["limit"] = limit

        return Response(res)

    def retrieve(self, pk):
        full = request.GET.get("full", True)
        jsondoc = get_object_or_404(JSONDocument, pk=pk)
        return Response(jsondoc.as_dict(full=full))
