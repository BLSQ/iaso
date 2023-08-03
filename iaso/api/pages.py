from django.contrib.auth.models import User
from rest_framework import serializers, permissions

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
        read_perm = "menupermissions.iaso_pages"
        write_perm = "menupermissions.iaso_page_write"

        if request.method in permissions.SAFE_METHODS and request.user and request.user.has_perm(read_perm):
            return True

        return request.user and request.user.has_perm(write_perm)


class PagesViewSet(ModelViewSet):
    permission_classes = [PagesPermission]
    serializer_class = PagesSerializer
    results_key = "results"
    lookup_url_kwarg = "pk"

    def get_object(self):
        # Allow finding by either pk or slug
        if not self.kwargs.get("pk", "").isnumeric():
            self.lookup_field = "slug"

        return super().get_object()

    def get_queryset(self):
        user = self.request.user
        order = self.request.query_params.get("order", "created_at").split(",")
        users = User.objects.filter(iaso_profile__account=user.iaso_profile.account)
        return Page.objects.filter(users__in=users).order_by(*order).distinct()
