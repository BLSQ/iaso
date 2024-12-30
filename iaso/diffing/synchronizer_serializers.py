from rest_framework import serializers

from iaso.models import OrgUnit


class BaseComparisonSerializer(serializers.Serializer):
    field = serializers.CharField(read_only=True)
    before = serializers.CharField(read_only=True)
    after = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    distance = serializers.IntegerField(read_only=True)


class NameComparisonSerializer(BaseComparisonSerializer):
    pass


class ParentComparisonSerializer(BaseComparisonSerializer):
    pass


class DateComparisonSerializer(BaseComparisonSerializer):
    before = serializers.DateField(read_only=True)
    after = serializers.DateField(read_only=True)


class GroupComparisonSerializer(BaseComparisonSerializer):
    before = serializers.ListField(read_only=True)
    after = serializers.ListField(read_only=True)


class GeometryComparisonSerializer(BaseComparisonSerializer):
    before = serializers.CharField(source="before.wkt", read_only=True)
    after = serializers.CharField(source="after.wkt", read_only=True)


class DiffOrgUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = [
            "id",
            "version",
            "source_ref",
            "location",
            "org_unit_type",
            "path",
            # Fields that can be synchronized via change requests.
            "name",
            "parent",
            "opening_date",
            "closed_date",
            "groups",
        ]


class DataSourceVersionsSynchronizerDiffSerializer(serializers.Serializer):
    """
    This serializer generates the exact format of the JSON stored in the
    `DataSourceVersionsSynchronization.json_diff` field.
    """

    org_unit = DiffOrgUnitSerializer()
    orgunit_ref = DiffOrgUnitSerializer()
    orgunit_dhis2 = DiffOrgUnitSerializer()
    status = serializers.CharField()
    comparisons = serializers.SerializerMethodField("get_comparisons_serializer")

    def get_comparisons_serializer(self, obj):
        serializers = []
        for comparison in obj.comparisons:
            if comparison.field == "name":
                serializers.append(NameComparisonSerializer(comparison).data)
            if comparison.field == "parent":
                serializers.append(ParentComparisonSerializer(comparison).data)
            if comparison.field in ("opening_date", "closed_date"):
                serializers.append(DateComparisonSerializer(comparison).data)
            if comparison.field == "geometry":
                serializers.append(GeometryComparisonSerializer(comparison).data)
            if comparison.field.startswith("group:"):
                serializers.append(GroupComparisonSerializer(comparison).data)
        return serializers
