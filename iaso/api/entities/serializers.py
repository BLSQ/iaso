from rest_framework import serializers

from iaso.api.common import EXPORTS_DATETIME_FORMAT
from iaso.models import Entity, Group, OrgUnit
from iaso.models.deduplication import ValidationStatus
from iaso.models.storage import StorageDevice


class EntityTypeColumnSerializer(serializers.Serializer):
    """Serialize EntityType columns."""

    name = serializers.CharField()
    type = serializers.CharField()
    label = serializers.CharField()


class EntityExportSerializer(serializers.ModelSerializer):
    """Entity serializer for csv/xlsx exports."""

    class Meta:
        model = Entity

        fields = [
            "id",
            "uuid",
            "entity_type_name",
            "created_at",
            "org_unit_name",
            "org_unit_id",
            "last_saved_instance",
        ]

    id = serializers.IntegerField(label="ID")
    uuid = serializers.UUIDField(label="UUID")
    entity_type_name = serializers.SerializerMethodField(label="Entity Type")
    created_at = serializers.DateTimeField(format=EXPORTS_DATETIME_FORMAT, label="Creation Date")
    org_unit_name = serializers.SerializerMethodField(label="HC")
    org_unit_id = serializers.SerializerMethodField(label="HC ID")
    last_saved_instance = serializers.SerializerMethodField(label="Last Update")

    def get_org_unit_id(self, obj):
        return obj.attributes and obj.attributes.org_unit and obj.attributes.org_unit.id or ""

    def get_org_unit_name(self, obj):
        return obj.attributes and obj.attributes.org_unit and obj.attributes.org_unit.name or ""

    def get_entity_type_name(self, obj):
        return obj.entity_type and obj.entity_type.name or ""

    def get_last_saved_instance(self, obj):
        if timestamp := getattr(obj, "last_saved_instance", None):
            return timestamp.strftime(EXPORTS_DATETIME_FORMAT)

        return ""

    def to_representation(self, instance):
        """
        Customise the serialization process to:
        - use field labels instead of field names as user-facing column headers
        - inject `entity_type_columns` from the serializer context.
        """
        serialized_data = super().to_representation(instance)

        data = {}

        for field_name, value in serialized_data.items():
            header = self.fields[field_name].label or field_name
            data[header] = value

        if "entity_type_columns" in self.context:
            json_data = instance.attributes and instance.attributes.json or {}

            for column in self.context["entity_type_columns"]:
                data[column["label"]] = json_data.get(column["name"], "")

        return data


class NestedGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name"]


class EntityListNestedOrgUnitSerializer(serializers.ModelSerializer):
    """Nested serializers for Org Units in the entities list."""

    class Meta:
        model = OrgUnit
        fields = [
            "id",
            "name",
            "short_name",
            "parent_id",
            "parent_name",
            "latitude",
            "longitude",
            "altitude",
            "has_geo_json",
            "org_unit_type",
            "org_unit_type_id",
            "org_unit_type_depth",
            "source_id",
            "source_name",
            "groups",
        ]

    short_name = serializers.CharField(source="name")
    groups = NestedGroupSerializer(many=True, read_only=True)
    has_geo_json = serializers.SerializerMethodField()
    org_unit_type = serializers.SerializerMethodField()
    org_unit_type_id = serializers.PrimaryKeyRelatedField(source="org_unit_type", read_only=True)
    org_unit_type_depth = serializers.SerializerMethodField()
    parent_name = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()
    altitude = serializers.SerializerMethodField()
    source_id = serializers.SerializerMethodField()
    source_name = serializers.SerializerMethodField()

    def get_org_unit_type(self, obj):
        return obj.org_unit_type and obj.org_unit_type.name

    def get_org_unit_type_depth(self, obj):
        return obj.org_unit_type and obj.org_unit_type.depth

    def get_parent_name(self, obj):
        return obj.parent and obj.parent.name

    def get_longitude(self, obj):
        return obj.location and obj.location.x

    def get_latitude(self, obj):
        return obj.location and obj.location.y

    def get_altitude(self, obj):
        return obj.location and obj.location.z

    def get_source_id(self, obj):
        return obj.version and obj.version.data_source and obj.version.data_source.id

    def get_source_name(self, obj):
        return obj.version and obj.version.data_source and obj.version.data_source.name

    def get_has_geo_json(self, obj):
        return bool(obj.simplified_geom)


class EntityListSerializer(serializers.ModelSerializer):
    """
    Entity serializer with support for dynamic extra columns.

    These user-defined columns are set on the EntityType's `fields_list_view` field and
    map to attributes on the Instance's json.
    """

    class Meta:
        model = Entity
        fields = [
            "id",
            "uuid",
            "name",
            "created_at",
            "updated_at",
            "attributes",
            "entity_type",
            "org_unit",
            "latitude",
            "longitude",
            "last_saved_instance",
            "has_duplicates",
        ]

    org_unit = serializers.SerializerMethodField()
    attributes = serializers.PrimaryKeyRelatedField(read_only=True)
    longitude = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()
    entity_type = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    last_saved_instance = serializers.SerializerMethodField()
    has_duplicates = serializers.SerializerMethodField()

    def get_org_unit(self, obj):
        return obj.attributes and EntityListNestedOrgUnitSerializer(obj.attributes.org_unit).data

    def get_last_saved_instance(self, obj):
        return getattr(obj, "last_saved_instance", None)

    def get_has_duplicates(self, obj):
        return getattr(obj, "has_duplicates", None)

    def get_name(self, obj):
        return obj.attributes and obj.attributes.json and obj.attributes.json.get("name")

    def get_longitude(self, obj):
        return obj.attributes and obj.attributes.location and obj.attributes.location.x

    def get_latitude(self, obj):
        return obj.attributes and obj.attributes.location and obj.attributes.location.y

    def get_entity_type(self, obj):
        return obj.entity_type and obj.entity_type.name

    def to_representation(self, instance):
        """Handle entity_type_columns from the serializer context."""
        data = super().to_representation(instance)
        if "entity_type_columns" not in self.context or not instance.attributes or not instance.attributes.json:
            return data

        for column in self.context["entity_type_columns"]:
            data[column["name"]] = instance.attributes.json.get(column["name"])

        return data


class EntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = [
            "id",
            "name",
            "uuid",
            "created_at",
            "updated_at",
            "attributes",
            "entity_type",
            "entity_type_name",
            "instances",
            "submitter",
            "org_unit",
            "duplicates",
            "nfc_cards",
        ]

    entity_type_name = serializers.SerializerMethodField()
    attributes = serializers.SerializerMethodField()
    submitter = serializers.SerializerMethodField()
    org_unit = serializers.SerializerMethodField()
    duplicates = serializers.SerializerMethodField()
    nfc_cards = serializers.SerializerMethodField()

    def get_attributes(self, entity: Entity):
        if entity.attributes:
            return entity.attributes.as_dict()
        return None

    def get_org_unit(self, entity: Entity):
        if entity.attributes and entity.attributes.org_unit:
            return entity.attributes.org_unit.as_dict_for_entity()
        return None

    def get_submitter(self, entity: Entity):
        try:
            # TODO: investigate type issue on next line
            submitter = entity.attributes.created_by.username  # type: ignore
        except AttributeError:
            submitter = None
        return submitter

    def get_duplicates(self, entity: Entity):
        return _get_duplicates(entity)

    def get_nfc_cards(self, entity: Entity):
        nfc_count = StorageDevice.objects.filter(entity=entity, type=StorageDevice.NFC).count()
        return nfc_count

    @staticmethod
    def get_entity_type_name(obj: Entity):
        return obj.entity_type.name if obj.entity_type else None


def _get_duplicates(entity):
    results = []
    e1qs = entity.duplicates1.filter(validation_status=ValidationStatus.PENDING)
    e2qs = entity.duplicates2.filter(validation_status=ValidationStatus.PENDING)
    if e1qs.count() > 0:
        results = results + list(map(lambda x: x.entity2.id, e1qs.all()))
    elif e2qs.count() > 0:
        results = results + list(map(lambda x: x.entity1.id, e2qs.all()))
    return results
