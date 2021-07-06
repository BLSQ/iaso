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
    queryset = Page.objects.all()


# router.register(r"polio/pages", PagesViewSet, basename="Pages")
