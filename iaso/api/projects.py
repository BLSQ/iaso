from django.core.paginator import Paginator
from rest_framework import viewsets, serializers
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated

from iaso.models import Project
from .auth.authentication import CsrfExemptSessionAuthentication


# class ProjectSerializer(serializers.Serializer):
#     name = serializers.CharField()
#     app_id = serializers.CharField()


class ProjectsViewSet(viewsets.ViewSet):
    """
    API to allow retrieval of forms.

    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = [IsAuthenticated]

    def list(self, request: Request) -> Response:
        limit = request.query_params.get("limit", None)
        page_offset = request.query_params.get("page", 1)
        queryset = Project.objects.filter(account=request.user.iaso_profile.account)

        if not limit:
            res = {"projects": [project.as_dict() for project in queryset]}
        else:
            limit = int(limit)
            page_offset = int(page_offset)
            paginator = Paginator(queryset, limit)
            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["projects"] = [project.as_dict() for project in page.object_list]
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit
        return Response(res)
