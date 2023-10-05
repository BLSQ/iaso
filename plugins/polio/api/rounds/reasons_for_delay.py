from plugins.polio.models import ReasonForDelay
from rest_framework import serializers
from iaso.api.common import ModelViewSet
from rest_framework import filters, permissions


class ReasonForDelaySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReasonForDelay
        fields = ["id", "name_fr", "name_en", "key_name"]


class ReasonForDelayViewSet(ModelViewSet):
    http_method_names = ["get"]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = ReasonForDelaySerializer

    def get_queryset(self):
        account = self.request.user.iaso_profile.account
        return ReasonForDelay.objects.filter(deleted_at__isnull=True).filter(account=account)
