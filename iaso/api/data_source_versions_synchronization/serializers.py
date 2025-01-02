from django.contrib.auth.models import User

from rest_framework import serializers

from iaso.api.common import TimestampField
from iaso.models import (
    DataSourceVersionsSynchronization,
    SourceVersion,
    Account,
)


class AccountNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ["id", "name", "default_version"]


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]


class DataSourceVersionNestedSerializer(serializers.ModelSerializer):
    data_source_name = serializers.CharField(source="data_source.name", read_only=True)

    class Meta:
        model = SourceVersion
        fields = ["id", "number", "description", "data_source", "data_source_name"]


class DataSourceVersionsSynchronizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSourceVersionsSynchronization
        fields = [
            "id",
            "name",
            "source_version_to_update",
            "source_version_to_compare_with",
            "count_create",
            "count_update",
            "sync_task",
            "account",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["source_version_to_update"] = DataSourceVersionNestedSerializer(
            instance.source_version_to_update, read_only=True
        ).data
        representation["source_version_to_compare_with"] = DataSourceVersionNestedSerializer(
            instance.source_version_to_compare_with, read_only=True
        ).data
        representation["account"] = AccountNestedSerializer(instance.account, read_only=True).data
        representation["created_by"] = UserNestedSerializer(instance.created_by, read_only=True).data
        return representation
