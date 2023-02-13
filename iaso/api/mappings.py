from django.core.paginator import Paginator
from rest_framework import viewsets, permissions
from rest_framework.response import Response

from iaso.models import Mapping
from .common import HasPermission


class MappingsViewSet(viewsets.ViewSet):
    """Mappings API

    This API is restricted to authenticated users having the "menupermissions.iaso_mappings" permission

    GET /api/mappings/
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_mappings")]  # type: ignore

    def list(self, request):
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
