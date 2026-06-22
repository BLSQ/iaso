from django.db import transaction
from django.db.models import Prefetch, QuerySet
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from qr_code.qrcode.maker import make_qr_code_image
from qr_code.qrcode.utils import QRCodeOptions
from rest_framework import filters, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import SAFE_METHODS

from iaso.api.query_params import parse_strict_boolean_param
from iaso.models import Project, ProjectFeatureFlags

from ...permissions.core_permissions import CORE_PROJECTS_PERMISSION, CORE_USERS_ADMIN_PERMISSION
from ..common import HasPermission, ModelViewSet
from .filters import ProjectsFilter
from .serializers import ProjectSerializer


@extend_schema(tags=["Projects"])
class ProjectsViewSet(ModelViewSet):
    """Projects API

    This API is restricted to authenticated users.

    GET /api/projects/
    GET /api/projects/<id>
    """

    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    filterset_class = ProjectsFilter
    ordering_fields = ["app_id", "name"]
    ordering = ["id"]
    serializer_class = ProjectSerializer
    results_key = "projects"
    http_method_names = ["get", "head", "options", "trace", "put", "post", "patch"]

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            self.permission_classes = [permissions.IsAuthenticated]
        else:
            self.permission_classes = [HasPermission(CORE_PROJECTS_PERMISSION)]
        return super().get_permissions()

    def get_queryset(self) -> QuerySet[Project]:
        bypass_restrictions = parse_strict_boolean_param(self.request.query_params.get("bypass_restrictions", None))
        projects = Project.objects.filter(account=self.request.user.iaso_profile.account).prefetch_related(
            Prefetch(
                "projectfeatureflags_set",
                queryset=ProjectFeatureFlags.objects.select_related("featureflag"),
            )
        )

        if not bypass_restrictions:
            projects = projects.filter_on_user_projects(self.request.user)
        else:
            # An admin should be able to bypass its own project restrictions in some cases,
            # e.g., for users management.
            if not self.request.user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()):
                raise PermissionDenied(f"{CORE_USERS_ADMIN_PERMISSION} permission is required to access all projects.")

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

    @transaction.atomic
    def perform_create(self, serializer):
        super().perform_create(serializer)
        # account = self.request.user.iaso_profile.account
        # AccountUsageService.increment(
        #     ProjectAccountUsage, account, initial_queryset=Project.objects.filter(account=account)
        # )
