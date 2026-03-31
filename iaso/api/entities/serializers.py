from rest_framework import serializers

from iaso.api.common import EXPORTS_DATETIME_FORMAT
from iaso.models import Entity, Group, OrgUnit
from iaso.models.storage import StorageDevice
from iaso.plugins import is_trypelim_plugin_active


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
    entity_type_name = serializers.CharField(label="Entity Type", source="entity_type.name", default="", read_only=True)
    created_at = serializers.DateTimeField(format=EXPORTS_DATETIME_FORMAT, label="Creation Date")
    org_unit_name = serializers.CharField(label="HC", source="attributes.org_unit.name", default="", read_only=True)
    org_unit_id = serializers.CharField(label="HC ID", source="attributes.org_unit.id", default="", read_only=True)
    last_saved_instance = serializers.SerializerMethodField(label="Last Update")

    def get_last_saved_instance(self, obj):
        if hasattr(obj, "last_saved_instance"):
            result = obj.last_saved_instance  # annotated value
        else:
            result = obj.get_latest_instance_created_at()

        return result.strftime(EXPORTS_DATETIME_FORMAT) if result else ""

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
    org_unit_type_id = serializers.PrimaryKeyRelatedField(source="org_unit_type", read_only=True)
    org_unit_type = serializers.CharField(source="org_unit_type.name", default=None, read_only=True)
    org_unit_type_depth = serializers.IntegerField(source="org_unit_type.depth", default=None, read_only=True)
    parent_name = serializers.CharField(source="parent.name", default=None, read_only=True)
    longitude = serializers.FloatField(source="location.x", default=None, read_only=True)
    latitude = serializers.FloatField(source="location.y", default=None, read_only=True)
    altitude = serializers.FloatField(source="location.z", default=None, read_only=True)
    source_id = serializers.IntegerField(source="version.data_source.id", default=None, read_only=True)
    source_name = serializers.CharField(source="version.data_source.name", default=None, read_only=True)
    has_geo_json = serializers.SerializerMethodField()

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

    org_unit = EntityListNestedOrgUnitSerializer(source="attributes.org_unit", default=None, read_only=True)
    attributes = serializers.PrimaryKeyRelatedField(read_only=True)
    longitude = serializers.FloatField(source="attributes.location.x", default=None, read_only=True)
    latitude = serializers.FloatField(source="attributes.location.y", default=None, read_only=True)
    entity_type = serializers.CharField(source="entity_type.name", default=None, read_only=True)
    name = serializers.SerializerMethodField()
    last_saved_instance = serializers.SerializerMethodField()
    has_duplicates = serializers.SerializerMethodField()

    def get_last_saved_instance(self, obj):
        if hasattr(obj, "last_saved_instance"):
            return obj.last_saved_instance  # annotated value

        return obj.get_latest_instance_created_at()

    def get_has_duplicates(self, obj):
        return bool(obj.get_pending_duplicate_ids())

    def get_name(self, obj):
        return obj.attributes and obj.attributes.json and obj.attributes.json.get("name")

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
            "migration_source",
        ]

    entity_type_name = serializers.SerializerMethodField()
    attributes = serializers.SerializerMethodField()
    submitter = serializers.SerializerMethodField()
    org_unit = serializers.SerializerMethodField()
    duplicates = serializers.ListField(
        source="get_pending_duplicate_ids", child=serializers.IntegerField(), read_only=True, default=[]
    )
    nfc_cards = serializers.SerializerMethodField()
    migration_source = serializers.SerializerMethodField()

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

    def get_nfc_cards(self, entity: Entity):
        nfc_count = StorageDevice.objects.filter(entity=entity, type=StorageDevice.NFC).count()
        return nfc_count

    @staticmethod
    def get_entity_type_name(obj: Entity):
        return obj.entity_type.name if obj.entity_type else None

    def get_migration_source(self, obj: Entity):
        if not obj.attributes:
            return None

        if is_trypelim_plugin_active() and obj.attributes.patient_set.exists():
            patient = obj.attributes.patient_set.first()
            if patient:
                return patient.id

        return None
