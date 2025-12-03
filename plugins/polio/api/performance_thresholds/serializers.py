import logging

from rest_framework import serializers

from plugins.polio.models.performance_thresholds import PerformanceThresholds


logger = logging.getLogger(__name__)


class PerformanceThresholdReadSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = PerformanceThresholds
        fields = [
            "id",
            "indicator",
            "fail_threshold",
            "warning_threshold",
            "success_threshold",
            "created_at",
            "updated_at",
        ]


class PerformanceThresholdWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceThresholds
        fields = [
            "id",
            "indicator",
            "fail_threshold",
            "warning_threshold",
            "success_threshold",
        ]

    def create(self, validated_data):
        request = self.context.get("request")
        profile = request.user.iaso_profile
        validated_data["account"] = profile.account
        return super().create(validated_data)

    def validate_fail_treshold(self, request_data):
        is_valid = PerformanceThresholds.is_json_logic_expression(request_data)
        if not is_valid:
            raise serializers.ValidationError({"Error": "Invalid JSON logic"})
        return request_data

    def validate_warning_treshold(self, request_data):
        is_valid = PerformanceThresholds.is_json_logic_expression(request_data)
        if not is_valid:
            raise serializers.ValidationError({"Error": "Invalid JSON logic"})
        return request_data

    def validate_success_treshold(self, request_data):
        is_valid = PerformanceThresholds.is_json_logic_expression(request_data)
        if not is_valid:
            raise serializers.ValidationError({"Error": "Invalid JSON logic"})
        return request_data
