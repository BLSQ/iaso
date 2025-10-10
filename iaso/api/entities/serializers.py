from rest_framework import serializers

from iaso.models import Entity
from iaso.models.deduplication import ValidationStatus
from iaso.models.storage import StorageDevice


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
    duplicates = serializers.SerializerMethodField()
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

    def get_duplicates(self, entity: Entity):
        return _get_duplicates(entity)

    def get_nfc_cards(self, entity: Entity):
        nfc_count = StorageDevice.objects.filter(entity=entity, type=StorageDevice.NFC).count()
        return nfc_count

    @staticmethod
    def get_entity_type_name(obj: Entity):
        return obj.entity_type.name if obj.entity_type else None

    def get_migration_source(self, obj: Entity):
        if not obj.attributes:
            return None

        if obj.attributes.patient_set.exists():
            patient = obj.attributes.patient_set.first()
            if patient:
                return patient.id

        return None


def _get_duplicates(entity):
    results = []
    e1qs = entity.duplicates1.filter(validation_status=ValidationStatus.PENDING)
    e2qs = entity.duplicates2.filter(validation_status=ValidationStatus.PENDING)
    if e1qs.count() > 0:
        results = results + list(map(lambda x: x.entity2.id, e1qs.all()))
    elif e2qs.count() > 0:
        results = results + list(map(lambda x: x.entity1.id, e2qs.all()))
    return results
