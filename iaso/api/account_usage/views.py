from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet

from iaso.api.account_usage.filters import AccountUsageFilter
from iaso.api.account_usage.pagination import AccountUsagePagination
from iaso.api.account_usage.serializers.list import AccountUsageListSerializer
from iaso.api.common.mixin import CustomPaginationListModelMixin
from iaso.models import AccountUsage


class AccountUsageViewSet(CustomPaginationListModelMixin, GenericViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = (DjangoFilterBackend, OrderingFilter)
    ordering = ["-period_starts_at"]
    filterset_class = AccountUsageFilter
    pagination_class = AccountUsagePagination

    def get_queryset(self):
        user = self.request.user
        iaso_profile = getattr(user, "iaso_profile", None)
        account = getattr(iaso_profile, "account", None)
        return AccountUsage.objects.filter(account=account)

    def get_serializer_class(self):
        if self.action == "list":
            return AccountUsageListSerializer
        raise NotImplementedError(f"Serializer is not implemented for {self.action}")
