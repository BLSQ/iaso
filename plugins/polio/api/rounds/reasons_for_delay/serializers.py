from rest_framework import serializers

from plugins.polio.models import ReasonForDelay


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
