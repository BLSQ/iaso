from rest_framework.viewsets import GenericViewSet

from iaso.api.common.mixin import CustomPaginationListModelMixin
from iaso.api.instances.pagination import ETLInstancePagination
from iaso.api.instances.permissions import HasInstancePermission
from iaso.api.instances.serializers import ETLInstanceListSerializer
from iaso.api.permission_checks import AuthenticationEnforcedPermission
from iaso.models import Instance


class ETLInstanceViewSet(CustomPaginationListModelMixin, GenericViewSet):
    permission_classes = [AuthenticationEnforcedPermission, HasInstancePermission]
    serializer_class = ETLInstanceListSerializer
    pagination_class = ETLInstancePagination

    def get_queryset(self):
        return Instance.objects.filter_for_user(user=self.request.user)
