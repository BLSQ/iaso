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
