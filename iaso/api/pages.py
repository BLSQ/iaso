from django.utils.translation import gettext_lazy as _
from django_filters.rest_framework import BooleanFilter, CharFilter, FilterSet
from rest_framework import permissions, serializers

from hat.menupermissions import models as permission
from iaso.api.common import ModelViewSet
from iaso.models import Page


class PagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = "__all__"

    def create(self, validated_data):
        request = self.context.get("request")
        users = validated_data.pop("users")
        page = Page.objects.create(**validated_data, account=request.user.iaso_profile.account)
        page.users.set(users)

        return page


class PagesPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        read_perm = permission.PAGES
        write_perm = permission.PAGE_WRITE

        if request.method in permissions.SAFE_METHODS and request.user and request.user.has_perm(read_perm):
            return True

        return request.user and request.user.has_perm(write_perm)


class PageFilter(FilterSet):
    search = CharFilter(method="filter_by_name_or_slug", label=_("Limit result by name or slug"))
    needs_authentication = BooleanFilter(
        field_name="needs_authentication", label=_("Limit on authentication required or not")
    )
    userId = CharFilter(field_name="users__id", lookup_expr="exact", label=_("User ID"))

    class Meta:
        model = Page
        fields = []

    def filter_by_name_or_slug(self, queryset, _, value):
        return queryset.filter(name__icontains=value) | queryset.filter(slug__icontains=value)


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
        if user.has_perm(permission.PAGES) and not user.has_perm(permission.PAGE_WRITE):
            return Page.objects.filter(users=user).order_by(*order).distinct()
        
        return Page.objects.filter(users__iaso_profile__account=user.iaso_profile.account).order_by(*order).distinct()
    
