from django.core.exceptions import PermissionDenied
from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import Group
from django.core.paginator import Paginator
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.http import JsonResponse


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
        orders = request.GET.get("order", "name").split(",")
        search = request.GET.get("search", None)

        queryset = queryset.distinct().annotate(org_unit_count=Count('org_units'))
        if search:
            queryset = queryset.filter(name__icontains=search)

        queryset = queryset.order_by(*orders)
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

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        group = get_object_or_404(Group, pk=pk)
        return Response(group.as_dict())

    def partial_update(self, request, pk=None):
        group = get_object_or_404(Group, pk=pk)
        name = request.data.get("name")
        if not name:
            return JsonResponse({"errorKey": "name", "errorMessage": "Nom requis"}, status=400)
        group.name = name
        group.save()

        return Response(group.as_dict())

    def create(self, request):
        group = Group()
        name = request.data.get("name")
        if not name:
            return JsonResponse({"errorKey": "name", "errorMessage": "Nom requis"}, status=400)
        group.name = name

        profile = request.user.iaso_profile
        version = profile.account.default_version
        group.source_version = version
        group.save()
        return Response(group.as_dict())

    def delete(self, request, pk=None):
        group = get_object_or_404(Group, pk=pk)
        group.delete()
        return Response(True)
