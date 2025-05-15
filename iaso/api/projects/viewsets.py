from django.db.models import QuerySet
from django.http import HttpResponse
from qr_code.qrcode.maker import make_qr_code_image
from qr_code.qrcode.utils import QRCodeOptions
from rest_framework import filters, permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied

from hat.menupermissions import models as permission
from iaso.models import Project

from ..common import ModelViewSet
from .serializers import ProjectSerializer


class ProjectsQuerystringSerializer(serializers.Serializer):
    bypass_restrictions = serializers.BooleanField(default=False)


class ProjectsViewSet(ModelViewSet):
    """Projects API

    This API is restricted to authenticated users.

    GET /api/projects/
    GET /api/projects/<id>
    """

    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["app_id", "name"]
    serializer_class = ProjectSerializer
    results_key = "projects"
    http_method_names = ["get", "head", "options", "trace"]

    def get_queryset(self) -> QuerySet[Project]:
        querystring = self.request.query_params
        querystring_serializer = ProjectsQuerystringSerializer(data=querystring)
        querystring_serializer.is_valid(raise_exception=True)
        bypass_restrictions = querystring_serializer.validated_data.get("bypass_restrictions")

        projects = Project.objects.filter(account=self.request.user.iaso_profile.account)

        if not bypass_restrictions:
            projects = projects.filter_on_user_projects(self.request.user)
        else:
            # An admin should be able to bypass its own project restrictions in some cases,
            # e.g., for users management.
            if not self.request.user.has_perm(permission.USERS_ADMIN):
                raise PermissionDenied(f"{permission.USERS_ADMIN} permission is required to access all projects.")

        return projects

    @action(detail=True, methods=["get"])
    def qr_code(self, request, *args, **kwargs):
        """Returns the qrcode image to configure the mobile application."""
        project = self.get_object()
        return HttpResponse(
            status=status.HTTP_200_OK,
            content_type="image/png",
            content=make_qr_code_image(
                data='{"url": "' + request.build_absolute_uri("/") + '", "app_id": "' + project.app_id + '"}',
                qr_code_options=QRCodeOptions(size="S", image_format="png", error_correction="L"),
            ),
        )
