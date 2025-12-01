from rest_framework import serializers

from iaso.api.common import TimestampField
from iaso.api.group_sets.serializers import GroupSetSerializer
from iaso.models import DataSource, Group, OrgUnit, SourceVersion


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
            "org_unit_ids",
            "org_units",
            "created_at",
            "updated_at",
            "block_of_countries",  # It's used to mark a group containing only countries
        ]
        read_only_fields = ["id", "source_version", "group_sets", "org_unit_count", "created_at", "updated_at"]
        ref_name = "iaso_group_serializer"

    source_version = SourceVersionSerializerForGroup(read_only=True)
    group_sets = GroupSetSerializer(many=True, read_only=True)
    org_unit_count = serializers.IntegerField(read_only=True)
    org_units = serializers.SerializerMethodField(read_only=True)
    org_unit_ids = serializers.PrimaryKeyRelatedField(
        source="org_units",
        write_only=True,
        many=True,
        queryset=OrgUnit.objects.none(),  # Scoped in __init__ via child_relation (see GroupSetSerializer pattern)
        required=False,
        allow_empty=True,
    )
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def get_org_units(self, obj):
        """Return list of org unit IDs for read operations."""
        return list(obj.org_units.values_list("id", flat=True))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and "org_unit_ids" in self.fields:
            user = request.user
            if user and user.is_authenticated:
                profile = user.iaso_profile
                queryset = OrgUnit.objects.filter_for_account(profile.account)

                editable_org_unit_type_ids = profile.get_editable_org_unit_type_ids()
                if editable_org_unit_type_ids:
                    queryset = queryset.filter(org_unit_type_id__in=editable_org_unit_type_ids)

                self.fields["org_unit_ids"].child_relation.queryset = queryset

    def validate(self, attrs):
        default_version = self._fetch_user_default_source_version()
        if "source_ref" in attrs and attrs["source_ref"]:
            # Check if the source_ref is already used by another group
            potential_group = Group.objects.filter(source_ref=attrs["source_ref"], source_version=default_version)
            if potential_group.exists():
                raise serializers.ValidationError(
                    {"source_ref": "This source ref is already used by another group in your default version"}
                )

        return super().validate(attrs)

    def create(self, validated_data):
        org_unit_ids = validated_data.pop("org_unit_ids", [])
        default_version = self._fetch_user_default_source_version()
        validated_data["source_version"] = default_version
        group = super().create(validated_data)
        if org_unit_ids:
            group.org_units.set(org_unit_ids)
        return group

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
