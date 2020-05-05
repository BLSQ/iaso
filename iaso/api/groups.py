from django.core.exceptions import PermissionDenied
from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import Group
from django.core.paginator import Paginator


class GroupsViewSet(viewsets.ViewSet):
    """
    list devices:
    """

    permission_classes = []

    def list(self, request):
        if request.user.is_anonymous:
            raise PermissionDenied("Please log in")

        profile = request.user.iaso_profile
        queryset = Group.objects.filter(
            source_version__data_source__projects__in=profile.account.project_set.all()
        )

        version = request.GET.get("version", None)
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)

        queryset = queryset.distinct().order_by("name")
        if version:
            queryset = queryset.filter(source_version=version)

        if not limit:
            res = {"groups": [group.as_dict() for group in queryset]}
        else:
            limit = int(limit)
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
