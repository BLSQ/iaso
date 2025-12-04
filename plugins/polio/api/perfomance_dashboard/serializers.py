import logging

from rest_framework import serializers

from iaso.models import OrgUnit
from plugins.polio.models.performance_dashboard import PerformanceDashboard


logger = logging.getLogger(__name__)


class PerformanceDashboardAuditSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    country_name = serializers.CharField(source="country.name", read_only=True)
    country_id = serializers.CharField(source="country.id", read_only=True)

    class Meta:
        model = PerformanceDashboard
        fields = [
            "id",
            "date",
            "status",
            "country_name",
            "country_id",
            "vaccine",
            "created_at",
            "updated_at",
        ]


class PerformanceDashboardListSerializer(serializers.ModelSerializer):
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
            "updated_at",
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
        validated_data["account"] = request.user.iaso_profile.account
        return super().create(validated_data)
