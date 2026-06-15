from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from iaso.api.account_feature_flags.pagination import AccountFeatureFlagPagination
from iaso.api.account_feature_flags.serializers.dropdown import AccountFeatureFlagDropdownSerializer
from iaso.api.account_feature_flags.serializers.list import AccountFeatureFlagListSerializer
from iaso.api.common import HasPermission
from iaso.api.common.mixin import CustomPaginationListModelMixin
from iaso.models import AccountFeatureFlag
from iaso.permissions.core_permissions import CORE_ACCOUNT_MANAGEMENT_PERMISSION


@extend_schema(tags=["Account feature flags"])
class AccountFeatureFlagViewSet(CustomPaginationListModelMixin, GenericViewSet):
    permission_classes = [IsAuthenticated, HasPermission(CORE_ACCOUNT_MANAGEMENT_PERMISSION)]
    pagination_class = AccountFeatureFlagPagination
    filter_backends = [OrderingFilter]
    ordering = ["name"]

    def get_serializer_class(self):
        if self.action == "list":
            return AccountFeatureFlagListSerializer
        if self.action == "dropdown":
            return AccountFeatureFlagDropdownSerializer
        raise NotImplementedError(f"Serializer not implemented for {self.action}")

    def get_queryset(self):
        if self.action == "list":
            return AccountFeatureFlag.objects.all()
        if self.action == "dropdown":
            return AccountFeatureFlag.objects.only("code", "name").all()
        return AccountFeatureFlag.objects.none()

    @extend_schema(responses=AccountFeatureFlagDropdownSerializer(many=True))
    @action(detail=False, methods=["GET"], pagination_class=None)
    def dropdown(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
