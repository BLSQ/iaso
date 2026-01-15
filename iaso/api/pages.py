from django.db import models
from django.utils.translation import gettext_lazy as _
from django_filters.rest_framework import BooleanFilter, CharFilter, FilterSet
from rest_framework import permissions, serializers

from iaso.api.common import ModelViewSet
from iaso.models import Page
from iaso.permissions.core_permissions import CORE_PAGE_WRITE_PERMISSION, CORE_PAGES_PERMISSION


class PagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = "__all__"

    def create(self, validated_data):
        request = self.context.get("request")
        users = validated_data.pop("users")
        user_roles = validated_data.pop("user_roles", [])
        page = Page.objects.create(**validated_data, account=request.user.iaso_profile.account)
        page.users.set(users)
        page.user_roles.set(user_roles)
        return page


class PagesPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        read_perm = CORE_PAGES_PERMISSION
        write_perm = CORE_PAGE_WRITE_PERMISSION

        if request.method in permissions.SAFE_METHODS and request.user and request.user.has_perm(read_perm.full_name()):
            return True

        return request.user and request.user.has_perm(write_perm.full_name())


class PageFilter(FilterSet):
    search = CharFilter(method="filter_by_name_or_slug", label=_("Limit result by name or slug"))
    needs_authentication = BooleanFilter(
        field_name="needs_authentication", label=_("Limit on authentication required or not")
    )
    userId = CharFilter(field_name="users__id", lookup_expr="exact", label=_("User ID"))
    userRoleIds = CharFilter(method="filter_by_user_roles", label=_("User Role IDs"))

    class Meta:
        model = Page
        fields = []

    def filter_by_name_or_slug(self, queryset, _, value):
        return queryset.filter(name__icontains=value) | queryset.filter(slug__icontains=value)

    def filter_by_user_roles(self, queryset, _, value):
        """Filter pages by user role IDs (comma-separated string)."""
        if not value:
            return queryset

        # Parse comma-separated IDs
        role_ids = [int(id.strip()) for id in value.split(",") if id.strip().isdigit()]

        if not role_ids:
            return queryset

        return queryset.filter(user_roles__id__in=role_ids)


class PagesViewSet(ModelViewSet):
    permission_classes = [PagesPermission]
    serializer_class = PagesSerializer
    results_key = "results"
    lookup_url_kwarg = "pk"
    filterset_class = PageFilter

    def get_object(self):
        # Allow finding by either pk or slug
        if not self.kwargs.get("pk", "").isnumeric():
            self.lookup_field = "slug"

        return super().get_object()

    def get_queryset(self):
        user = self.request.user
        order = self.request.query_params.get("order", "created_at").split(",")
        user_groups = user.groups.all()

        if user.has_perm(CORE_PAGE_WRITE_PERMISSION.full_name()):
            # WRITE users see ALL pages
            queryset = Page.objects.filter(account=user.iaso_profile.account)

        elif user.has_perm(CORE_PAGES_PERMISSION.full_name()):
            # READ-ONLY users see only pages they can access
            queryset = Page.objects.filter(
                models.Q(users=user) | models.Q(user_roles__group__in=user_groups)
            ).distinct()
        else:
            queryset = Page.objects.none()

        return queryset.order_by(*order).distinct()
