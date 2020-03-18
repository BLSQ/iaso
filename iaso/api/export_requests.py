from django.core.exceptions import PermissionDenied
from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import ExportRequest
from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.core.paginator import Paginator


class ExportRequestsViewSet(viewsets.ViewSet):
    """
    list export_requests:
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
        queryset = ExportRequest.objects.all()
        queryset = queryset.order_by("-id")
        # TODO limit to account ?

        limit = request.GET.get("limit", 100)
        page_offset = request.GET.get("page", 1)

        limit = min(int(limit), 100)
        page_offset = int(page_offset)
        paginator = Paginator(queryset, limit)
        res = {"count": paginator.count}
        if page_offset > paginator.num_pages:
            page_offset = paginator.num_pages
        page = paginator.page(page_offset)

        res["groups"] = [group.as_dict() for group in page.object_list]
        res["has_next"] = page.has_next()
        res["has_previous"] = page.has_previous()
        res["page"] = page_offset
        res["pages"] = paginator.num_pages
        res["limit"] = limit
        return Response(res)
