from rest_framework import serializers

from iaso.api.common import TimestampField
from iaso.api.group_sets.serializers import GroupSetSerializer
from iaso.models import DataSource, Group, SourceVersion


class DataSourceSerializerForGroup(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = ["id", "name"]


class SourceVersionSerializerForGroup(serializers.ModelSerializer):
    class Meta:
        model = SourceVersion
        fields = ["id", "number", "data_source"]

    data_source = DataSourceSerializerForGroup()


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "source_ref",
            "source_version",
            "group_sets",
            "org_unit_count",
            "created_at",
            "updated_at",
            "block_of_countries",  # It's used to mark a group containing only countries
        ]
        read_only_fields = ["id", "source_version", "group_sets", "org_unit_count", "created_at", "updated_at"]
        ref_name = "iaso_group_serializer"

    source_version = SourceVersionSerializerForGroup(read_only=True)
    group_sets = GroupSetSerializer(many=True, read_only=True)
    org_unit_count = serializers.IntegerField(read_only=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def validate(self, attrs):
        default_version = self._fetch_user_default_source_version()
        if "source_ref" in attrs:
            # Check if the source_ref is already used by another group
            potential_group = Group.objects.filter(source_ref=attrs["source_ref"], source_version=default_version)
            if potential_group.exists():
                raise serializers.ValidationError(
                    {"source_ref": "This source ref is already used by another group in your default version"}
                )

        return super().validate(attrs)

    def create(self, validated_data):
        default_version = self._fetch_user_default_source_version()
        validated_data["source_version"] = default_version
        return super().create(validated_data)

    def _fetch_user_default_source_version(self):
        profile = self.context["request"].user.iaso_profile
        version = profile.account.default_version
        if version is None:
            raise serializers.ValidationError("This account has no default version")
        return version


class GroupDropdownSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()

    def get_label(self, obj):
        datasource = obj.source_version.data_source.name
        version_number = obj.source_version.number
        name = obj.name
        return f"{name} ({datasource} - {version_number})"

    class Meta:
        model = Group
        fields = ["id", "name", "label"]
        read_only_fields = ["id", "name", "label"]


class GroupExportSerializer(serializers.Serializer):
    """
    Serializer for exporting groups in XLSX or CSV.
    """

    file_format = serializers.ChoiceField(choices=["xlsx", "csv"])
