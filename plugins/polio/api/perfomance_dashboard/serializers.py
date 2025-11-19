import logging

from rest_framework import serializers

from iaso.api.common import TimestampField
from iaso.models import OrgUnit, User
from plugins.polio.models.performance_dashboard import PerformanceDashboard

logger = logging.getLogger(__name__)


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]
        ref_name = "UserNestedSerializerForNationalLogisticsPlan"


class OrgUnitNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name"]
        ref_name = "OrgUnitNestedSerializerForNationalLogisticsPlan"


class PerformanceDashboardListSerializer(serializers.ModelSerializer):
    created_by = UserNestedSerializer(read_only=True)
    updated_by = UserNestedSerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    # For read operations, we want to display the country's name
    country_name = serializers.CharField(source="country.name", read_only=True)
    # For write operations (create/update), we expect the country ID
    country_id = serializers.PrimaryKeyRelatedField(
        source="country", queryset=OrgUnit.objects.all(), write_only=True
    )

    class Meta:
        model = PerformanceDashboard
        fields = [
            "id",
            "date",
            "status",
            "country_name",  # For read operations (displaying nested country object)
            "country_id",  # For write operations (accepting country ID)
            "antigen",
            "account",
            "created_at",
            "created_by",
            "updated_at",
            "updated_by",
        ]
        read_only_fields = [
            "account"
        ]  # Account will be set automatically by the view or create method


class PerformanceDashboardWriteSerializer(serializers.ModelSerializer):
    # Expect the country ID for write operations
    country_id = serializers.PrimaryKeyRelatedField(
        source="country", queryset=OrgUnit.objects.all(), write_only=True
    )

    class Meta:
        model = PerformanceDashboard
        fields = [
            "id",
            "date",
            "status",
            "country_id",  # Only country_id is needed for input
            "antigen",
        ]
        # read_only_fields = ["account"] # No longer needed here


    def create(self, validated_data):
        request = self.context.get("request")

        if request and hasattr(request, "user") and request.user.is_authenticated:
            try:
                profile = request.user.iaso_profile
                validated_data["created_by"] = request.user
                validated_data["account"] = (
                    profile.account
                )  # Ensure account is set here
            except AttributeError as e:
                logger.error(
                    f"User {request.user} does not have an iaso_profile or account: {e}"
                )
                raise serializers.ValidationError("User profile or account not found.")
            except Exception as e:
                logger.error(
                    f"Unexpected error getting profile/account for {request.user}: {e}"
                )
                raise serializers.ValidationError(
                    "Unexpected error encountered while fetching profile/account."
                )
        else:
            # This should ideally not happen if permissions are checked correctly before the serializer
            logger.error(
                "Request or authenticated user not available in context during creation."
            )
            raise serializers.ValidationError(
                "Request context or authenticated user missing."
            )

        # Call the parent create method with the updated validated_data
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Set updated_by automatically from the request user
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user.is_authenticated:
            validated_data["updated_by"] = request.user
        # Note: account is typically not changed during an update
        return super().update(instance, validated_data)
