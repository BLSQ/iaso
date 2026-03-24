from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.viewsets import GenericViewSet

from iaso.api.common.mixin import CustomPaginationListModelMixin
from iaso.api.validation_workflows.filters import MobileValidationWorkflowListFilter
from iaso.api.validation_workflows.pagination import MobileValidationWorkflowPagination
from iaso.api.validation_workflows.permissions import HasValidationWorkflowPermission
from iaso.api.validation_workflows.serializers.mobile import MobileValidationWorkflowListSerializer
from iaso.models import Instance


@extend_schema(tags=["Validation workflows", "Mobile"])
class ValidationWorkflowMobileViewSet(CustomPaginationListModelMixin, GenericViewSet):
    filter_backends = [DjangoFilterBackend]
    permission_classes = (IsAuthenticated, HasValidationWorkflowPermission)
    filterset_class = MobileValidationWorkflowListFilter
    pagination_class = MobileValidationWorkflowPagination
    serializer_class = MobileValidationWorkflowListSerializer
    http_method_names = ["head", "options", "get"]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]

    def get_queryset(self):
        return (
            Instance.objects.filter_for_user(self.request.user)
            .filter(form__deleted_at__isnull=True, validationnode__isnull=False)
            .distinct()
        )
