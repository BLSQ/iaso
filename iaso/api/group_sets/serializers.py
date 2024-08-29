from rest_framework import serializers
from iaso.models import GroupSet, Group, DataSource, SourceVersion
from iaso.api.common import TimestampField, DynamicFieldsModelSerializer


class DataSourceSerializerForGroupset(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = ["id", "name"]


class SourceVersionSerializerForGroupset(serializers.ModelSerializer):
    class Meta:
        model = SourceVersion
        fields = ["id", "number", "data_source"]

    data_source = DataSourceSerializerForGroupset()


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group

        fields = ["id", "name", "created_at", "updated_at", "source_version"]
        default_fields = ["id", "name", "created_at", "updated_at"]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    source_version = SourceVersionSerializerForGroupset(read_only=True)


class GroupSetSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = GroupSet
        default_fields = [
            "id",
            "name",
            "source_version",
            "created_at",
            "updated_at",
        ]
        fields = [
            "id",
            "name",
            "source_version",
            "groups",
            "created_at",
            "updated_at",
        ]

    source_version = SourceVersionSerializerForGroupset(read_only=True)
    groups = GroupSerializer(many=True, read_only=True)

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
