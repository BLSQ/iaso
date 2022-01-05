from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import serializers
from iaso.api.common import ModelViewSet
from iaso.models import Page, Account


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
        if self.kwargs.get("pk", "").isnumeric() == False:
            self.lookup_field = "slug"

        return super().get_object()

    def get_queryset(self):
        user = self.request.user
        order = self.request.query_params.get("order", "created_at").split(",")
        return (
            Page.objects.filter(users__in=User.objects.filter(iaso_profile__account=user.iaso_profile.account))
            .order_by(*order)
            .all()
        )
