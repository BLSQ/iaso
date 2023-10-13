from hat.audit.audit_mixin import AuditMixin
from plugins.polio.models import ReasonForDelay
from rest_framework import serializers
from iaso.api.common import ModelViewSet, HasPermission
from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.response import Response
from hat.menupermissions import models as permission
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore


class AuditReasonForDelaySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReasonForDelay
        fields = "__all__"


class ReasonForDelayForCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReasonForDelay
        fields = ["id", "name_fr", "name_en", "key_name"]


class ReasonForDelayFieldSerializer(serializers.Field):
    def to_representation(self, value):
        if value:
            return value.key_name
        return None

    def to_internal_value(self, data):
        account = self.context["request"].user.iaso_profile.account
        try:
            reason_for_delay = ReasonForDelay.objects.get(key_name=data, account=account)
            return reason_for_delay
        except ReasonForDelay.DoesNotExist:
            raise serializers.ValidationError(f"key_name not found: {data}")


class ReasonForDelaySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReasonForDelay
        fields = ["id", "name_fr", "name_en", "key_name", "created_at", "updated_at", "times_selected"]

        read_only_fields = ["created_at", "updated_at", "id"]

    times_selected = serializers.SerializerMethodField()

    def get_times_selected(self, reason_for_delay):
        return len(list(reason_for_delay.round_history_entries.all()))

    def validate(self, data):
        request = self.context["request"]
        key_name = data.get("key_name", None)
        name_en = data.get("name_en", None)
        if request.method == "POST" and key_name is None:
            raise serializers.ValidationError("requiredField")
        if request.method == "POST" and name_en is None:
            raise serializers.ValidationError("requiredField")
        return super().validate(data)

    def create(self, validated_data):
        account = self.context["request"].user.iaso_profile.account
        validated_data["account"] = account

        return super().create(validated_data)


class ReasonForDelayViewSet(AuditMixin, ModelViewSet):
    http_method_names = ["get", "post", "patch"]
    permission_classes = [HasPermission(permission.POLIO_CONFIG)]  # type: ignore
    serializer_class = ReasonForDelaySerializer
    ordering_fields = ["updated_at", "created_at", "name_en", "name_fr", "key_name", "id"]
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
    ]

    audit_serializer = AuditReasonForDelaySerializer  # type: ignore

    # TODO annotate to be able to sort on time_selected
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
