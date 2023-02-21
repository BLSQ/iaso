from django.contrib.auth.models import User
from rest_framework import serializers

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


class PagesViewSet(ModelViewSet):
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
