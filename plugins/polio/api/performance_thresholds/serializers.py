import logging

from rest_framework import serializers

from iaso.api.common import UserSerializer
from iaso.models import OrgUnit
from plugins.polio.models.performance_thresholds import PerformanceThresholds


logger = logging.getLogger(__name__)


class OrgUnitNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name"]
        ref_name = "OrgUnitNestedSerializerForNationalLogisticsPlan"


class PerformanceThresholdListSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = PerformanceThresholds
        fields = [
            "id",
            "indicator",
            "timeline",
            "fail_threshold",
            "success_threshold",
            "inclusive",
            "account",
            "created_at",
            "created_by",
            "updated_at",
            "updated_by",
        ]
        read_only_fields = ["account"]


class PerformanceThresholdWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceThresholds
        fields = [
            "id",
            "indicator",
            "timeline",
            "fail_threshold",
            "success_threshold",
            "inclusive",
        ]

    def create(self, validated_data):
        request = self.context.get("request")
        profile = request.user.iaso_profile
        validated_data["created_by"] = request.user
        validated_data["account"] = profile.account
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        validated_data["updated_by"] = request.user
        return super().update(instance, validated_data)

    def validate(self, data):
        """
        Custom validation to ensure 'fail_threshold' and 'success_threshold'
        are either valid numbers OR specific allowed keywords.
        """
        valid_keywords = ["AVERAGE", "NO_LIMIT"]

        for field_name in ["fail_threshold", "success_threshold"]:
            value = data.get(field_name)

            if value:
                if value not in valid_keywords:
                    try:
                        float(value)
                    except ValueError:
                        raise serializers.ValidationError(
                            {field_name: f"Value '{value}' is invalid. Must be a number or one of: {valid_keywords}"}
                        )

        lower = data.get("fail_threshold")
        upper = data.get("success_threshold")

        if lower and upper:
            is_lower_num = lower not in valid_keywords
            is_upper_num = upper not in valid_keywords

            if is_lower_num and is_upper_num:
                if float(lower) > float(upper):
                    raise serializers.ValidationError(
                        {"non_field_errors": "Fail threshold cannot be greater Success threshold."}
                    )

        return data
