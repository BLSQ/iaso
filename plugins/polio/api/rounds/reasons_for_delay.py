from plugins.polio.models import ReasonForDelay
from rest_framework import serializers
from iaso.api.common import ModelViewSet,HasPermission
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from hat.menupermissions import models as permission

#TODO switch serializers and @action decorator
class ReasonForDelaySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReasonForDelay
        fields = ["id", "name_fr", "name_en", "key_name"]


class ReasonForDelayTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReasonForDelay
        fields = ["id", "name_fr", "name_en", "key_name", "created_at", "updated_at", "times_selected"]
        
        read_only_fields = ["created_at", "updated_at"]
        
    times_selected = serializers.SerializerMethodField()

    def get_times_selected(self, reason_for_delay):
        return len(list(reason_for_delay.round_history_entries.all()))


class ReasonForDelayViewSet(ModelViewSet):
    http_method_names = ["get"]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = ReasonForDelaySerializer

    def get_queryset(self):
        account = self.request.user.iaso_profile.account
        return ReasonForDelay.objects.filter(deleted_at__isnull=True).filter(account=account)

    @action(methods=["GET"], detail=False, permission_classes = [HasPermission(permission.POLIO_CONFIG)])
    def tableview(self, request):
        queryset = self.get_queryset()
        reasons_for_delay = ReasonForDelayTableSerializer(queryset, many=True).data
        response = Response({"results": reasons_for_delay})
        return response
