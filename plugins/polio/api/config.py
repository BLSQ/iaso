from drf_yasg.utils import swagger_auto_schema
from rest_framework import serializers

from iaso.api.common import ModelViewSet
from plugins.polio.models import Config


class ConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = Config
        fields = ["created_at", "updated_at", "key", "data"]

    data = serializers.JSONField(source="content")  # type: ignore
    key = serializers.CharField(source="slug")


@swagger_auto_schema(tags=["polio-configs"])
class ConfigViewSet(ModelViewSet):
    http_method_names = ["get"]
    serializer_class = ConfigSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Config.objects.filter(users=self.request.user)
