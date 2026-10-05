import uuid

from django.utils import timezone

from iaso import models as m
from iaso.api.instances.import_cache import InstanceImportCache
from iaso.test import TestCase


class InstanceImportCacheTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        cls.data_source = m.DataSource.objects.create(name="Source")
        cls.version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.org_unit = m.OrgUnit.objects.create(name="Facility", uuid="facility-uuid", version=cls.version)
        cls.instance = m.Instance.objects.create(uuid="instance-uuid", file_name="instance.xml")
        # Older data can have several instances with the same uuid
        cls.duplicate_1 = m.Instance.objects.create(uuid="duplicated-uuid", file_name="duplicate_1.xml")
        cls.duplicate_2 = m.Instance.objects.create(uuid="duplicated-uuid", file_name="duplicate_2.xml")

    def test_existing_instances_in_a_single_query(self):
        with self.assertNumQueries(1):
            cache = InstanceImportCache(["instance-uuid", "duplicated-uuid", "new-uuid", None, ""])

        with self.assertNumQueries(0):
            self.assertEqual(cache.instances("instance-uuid"), [self.instance])
            self.assertEqual(cache.instance("instance-uuid"), self.instance)
            self.assertEqual(cache.instances("new-uuid"), [])
            self.assertIsNone(cache.instance("new-uuid"))

    def test_duplicated_uuid(self):
        cache = InstanceImportCache(["duplicated-uuid"])

        # Oldest first, as `.first()` would pick, and no single instance to pick
        self.assertEqual(cache.instances("duplicated-uuid"), [self.duplicate_1, self.duplicate_2])
        self.assertIsNone(cache.instance("duplicated-uuid"))

    def test_add_instance(self):
        cache = InstanceImportCache(["new-uuid"])
        instance = m.Instance.objects.create(uuid="new-uuid", file_name="new.xml")

        cache.add_instance(instance)

        self.assertEqual(cache.instance("new-uuid"), instance)

    def test_org_unit_looked_up_once(self):
        cache = InstanceImportCache([])

        with self.assertNumQueries(1):
            self.assertEqual(cache.org_unit("facility-uuid", self.version.id), self.org_unit)
            self.assertEqual(cache.org_unit("facility-uuid", self.version.id), self.org_unit)

        with self.assertRaises(m.OrgUnit.DoesNotExist):
            cache.org_unit("facility-uuid", None)

    def test_existing_entities_in_a_single_query(self):
        entity_type = m.EntityType.objects.create(name="Patient", account=self.account)
        patient = m.Entity.objects.create(uuid=uuid.uuid4(), entity_type=entity_type, account=self.account)
        # Older data can have several entities with the same uuid, even soft-deleted ones
        duplicated_uuid = uuid.uuid4()
        duplicate = m.Entity.objects.create(uuid=duplicated_uuid, entity_type=entity_type, account=self.account)
        deleted_duplicate = m.Entity.objects.create(
            uuid=duplicated_uuid, entity_type=entity_type, account=self.account, deleted_at=timezone.now()
        )
        other_account = m.Account.objects.create(name="Other account")
        m.Entity.objects.create(uuid=patient.uuid, entity_type=entity_type, account=other_account)
        new_uuid = str(uuid.uuid4())
        cache = InstanceImportCache([])

        with self.assertNumQueries(1):
            cache.prefetch_entities(
                self.account,
                [
                    # As sent by the mobile app: strings, the uuid possibly in capitals
                    (str(patient.uuid).upper(), str(entity_type.id)),
                    (str(duplicated_uuid), str(entity_type.id)),
                    (new_uuid, str(entity_type.id)),
                    ("not-a-uuid", str(entity_type.id)),
                ],
            )

        with self.assertNumQueries(0):
            self.assertEqual(cache.entities(str(patient.uuid), entity_type.id), [patient])
            self.assertCountEqual(cache.entities(str(duplicated_uuid), entity_type.id), [duplicate, deleted_duplicate])
            self.assertEqual(cache.entities(new_uuid, entity_type.id), [])
            # Not prefetched: up to `find_entity()` to look them up
            self.assertIsNone(cache.entities(str(uuid.uuid4()), entity_type.id))
            self.assertIsNone(cache.entities("not-a-uuid", entity_type.id))

    def test_add_entity(self):
        entity_type = m.EntityType.objects.create(name="Patient", account=self.account)
        new_uuid = str(uuid.uuid4())
        cache = InstanceImportCache([])
        cache.prefetch_entities(self.account, [(new_uuid, str(entity_type.id))])
        # Created as `find_entity()` does, with the payload's strings
        entity = m.Entity.objects.create(uuid=new_uuid, entity_type_id=str(entity_type.id), account=self.account)

        cache.add_entity(entity)

        self.assertEqual(cache.entities(new_uuid, str(entity_type.id)), [entity])
