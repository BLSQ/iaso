from plugins.polio.models import ReasonForDelay
from rest_framework import serializers
from iaso.api.common import ModelViewSet, HasPermission
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from hat.menupermissions import models as permission


class ReasonForDelayForCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReasonForDelay
        fields = ["id", "name_fr", "name_en", "key_name"]


class ReasonForDelaySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReasonForDelay
        fields = ["id", "name_fr", "name_en", "key_name", "created_at", "updated_at", "times_selected"]

        read_only_fields = ["created_at", "updated_at", "id"]

    times_selected = serializers.SerializerMethodField()

    def get_times_selected(self, reason_for_delay):
        return len(list(reason_for_delay.round_history_entries.all()))

    def validate(self, data):
        key_name = data.get("key_name", None)
        name_en = data.get("name_en", None)
        if key_name is None:
            raise serializers.ValidationError("key_name is mandatory")
        if name_en is None:
            raise serializers.ValidationError("You should provide at least an EN translation")
        # Checking that updates are made from user from the same accont as the Reason for delay
        if self.instance is not None:
            user_account = self.context["request"].user.iaso_profile.account
            if user_account != self.instance.account:
                raise serializers.ValidationError("user cannot modify reasons for delay on this account")
        return super().validate(data)

    def create(self, validated_data):
        account = self.context["request"].user.iaso_profile.account
        validated_data["account"] = account

        return super().create(validated_data)


class ReasonForDelayViewSet(ModelViewSet):
    http_method_names = ["get", "post", "patch"]
    permission_classes = [HasPermission(permission.POLIO_CONFIG)]  # type: ignore
    serializer_class = ReasonForDelaySerializer

    def get_queryset(self):
        account = self.request.user.iaso_profile.account
        return ReasonForDelay.objects.filter(deleted_at__isnull=True).filter(account=account)

    # This endpoint is to populate the dropdown choices for regular polio users
    @action(methods=["GET"], detail=False, permission_classes=[HasPermission(permission.POLIO, permission.POLIO_CONFIG)])  # type: ignore
    def forcampaign(self, request):
        queryset = self.get_queryset()
        reasons_for_delay = ReasonForDelayForCampaignSerializer(queryset, many=True).data
        response = Response({"results": reasons_for_delay})
        return response
