from django.shortcuts import get_object_or_404
from rest_framework import viewsets, serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated

from iaso.models import Project
from .common import TimestampField, Paginator
from .auth.authentication import CsrfExemptSessionAuthentication


class HasProjectPermission(IsAuthenticated):
    """Rules:

    - The projects API is only accessible to authenticated users
    - Read & write actions on specific projects can only be performed for users linked to the project account
    """

    def has_object_permission(self, request: Request, view, obj: Project):
        return request.user.iaso_profile.account == obj.account


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'app_id', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    created_at = TimestampField()
    updated_at = TimestampField()


class ProjectPaginator(Paginator):
    results_response_key = "projects"


class ProjectsViewSet(viewsets.ViewSet):
    """Projects API: /api/projects/"""

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (HasProjectPermission,)

    def list(self, request: Request) -> Response:
        queryset = Project.objects.filter(account=request.user.iaso_profile.account)
        paginator = ProjectPaginator()
        page = paginator.paginate_queryset(queryset, request, self)

        if page is not None:
            serializer = ProjectSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ProjectSerializer(queryset, many=True)
        return Response({"projects": serializer.data})

    def retrieve(self, request, pk=None):
        queryset = Project.objects.all()
        project = get_object_or_404(queryset, pk=pk)
        if project.account != request.user.iaso_profile.account:
            raise PermissionDenied()

        serializer = ProjectSerializer(project)

        return Response(serializer.data)
