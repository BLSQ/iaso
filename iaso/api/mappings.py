from django.core.exceptions import PermissionDenied
from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import Mapping
from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.core.paginator import Paginator


class MappingsViewSet(viewsets.ViewSet):
    """
    list mappings:
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []
    permission_required = ["menupermissions.iaso_mappings"]

    def list(self, request):
        if request.user.is_anonymous:
            raise PermissionDenied("Please log in")

        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)

        queryset = Mapping.objects.distinct().order_by("updated_at")

        if not limit:
            res = {"mappings": [group.as_dict() for group in queryset]}
        else:
            limit = int(limit)
            page_offset = int(page_offset)
            paginator = Paginator(queryset, limit)
            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["mappings"] = [mapping.as_dict() for mapping in page.object_list]
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit
        return Response(res)
