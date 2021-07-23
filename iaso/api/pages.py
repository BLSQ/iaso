from rest_framework import serializers

from iaso.api.common import ModelViewSet
from iaso.models import Page


class PagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = "__all__"


class PagesViewSet(ModelViewSet):
    serializer_class = PagesSerializer
    results_key = "results"
    lookup_field = "slug"

    def get_queryset(self):
        user = self.request.user

        return Page.objects.filter(users=user).all()


# router.register(r"polio/pages", PagesViewSet, basename="Pages")
