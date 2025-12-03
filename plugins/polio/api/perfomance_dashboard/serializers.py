import logging

from rest_framework import serializers

from iaso.api.common import UserSerializer
from iaso.models import OrgUnit
from plugins.polio.models.performance_dashboard import PerformanceDashboard


logger = logging.getLogger(__name__)


class OrgUnitNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name"]
        ref_name = "OrgUnitNestedSerializerForNationalLogisticsPlan"


class PerformanceDashboardListSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    country_name = serializers.CharField(source="country.name", read_only=True)

    class Meta:
        model = PerformanceDashboard
        fields = [
            "id",
            "date",
            "status",
            "country_name",
            "country_id",
            "vaccine",
            "account",
            "created_at",
            "created_by",
            "updated_at",
            "updated_by",
        ]
        read_only_fields = ["account"]
        extra_kwargs = {"country_id": {"read_only": True}}


class PerformanceDashboardWriteSerializer(serializers.ModelSerializer):
    # Expect the country ID for write operations
    country_id = serializers.PrimaryKeyRelatedField(source="country", queryset=OrgUnit.objects.all(), write_only=True)

    class Meta:
        model = PerformanceDashboard
        fields = [
            "id",
            "date",
            "status",
            "country_id",
            "vaccine",
        ]

    def create(self, validated_data):
        request = self.context.get("request")
        if not request:
            raise serializers.ValidationError("Request context is missing")
        user = request.user
        validated_data["created_by"] = user
        validated_data["account"] = user.iaso_profile.account
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context["request"]
        if not request:
            raise serializers.ValidationError("Request context is missing")

        validated_data["updated_by"] = request.user
        return super().update(instance, validated_data)
