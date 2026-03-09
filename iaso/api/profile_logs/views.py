import django_filters

from rest_framework import filters

from hat.audit.models import Modification
from iaso.api.common import HasPermission, ModelViewSet
from iaso.api.profile_logs.filters import ProfileLogsListFilter
from iaso.api.profile_logs.pagination import ProfileLogsListPagination
from iaso.api.profile_logs.serializers import ProfileLogListSerializer, ProfileLogRetrieveSerializer
from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION


class ProfileLogsViewSet(ModelViewSet):
    permission_classes = [HasPermission(CORE_USERS_ADMIN_PERMISSION)]
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    filterset_class = ProfileLogsListFilter
    pagination_class = ProfileLogsListPagination
    ordering_fields = ["created_at"]

    http_method_names = ["get"]

    def get_queryset(self):
        order = self.request.query_params.get("order", "-created_at")
        request_user = self.request.user

        queryset = (
            Modification.objects.select_related("user")
            .filter(content_type__app_label="iaso")
            .filter(content_type__model="profile")
            .filter(user__iaso_profile__account=request_user.iaso_profile.account)
        )

        if "created_at" in order:
            queryset = queryset.order_by(order)
        elif order == "modified_by":
            queryset = queryset.order_by("user__username")
        elif order == "-modified_by":
            queryset = queryset.order_by("-user__username")
        elif order == "user":
            queryset = queryset.order_by("new_value__0__fields__user__username")
        elif order == "-user":
            queryset = queryset.order_by("-new_value__0__fields__user__username")

        return queryset

    def get_serializer_class(self):
        if hasattr(self, "action") and self.action == "list":
            return ProfileLogListSerializer
        if hasattr(self, "action") and self.action == "retrieve":
            return ProfileLogRetrieveSerializer
        return super().get_serializer_class()
