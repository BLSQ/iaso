from django.test import TestCase
from django.utils.timezone import now

from iaso.tests.models.models_for_test import TestSoftDeletableModel


class SoftDeletableManagerTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.active_1 = TestSoftDeletableModel.objects.create(name="Active 1")
        cls.active_2 = TestSoftDeletableModel.objects.create(name="Active 2")
        cls.active_3 = TestSoftDeletableModel.objects.create(name="Active 3")
        cls.deleted = TestSoftDeletableModel.objects.create(name="Deleted", deleted_at=now())

    def test_default_manager_excludes_deleted(self):
        self.assertQuerySetEqual(
            TestSoftDeletableModel.objects.order_by("id"),
            [self.active_1, self.active_2, self.active_3],
        )

    def test_include_deleted_manager_returns_all(self):
        self.assertEqual(TestSoftDeletableModel.objects_include_deleted.count(), 4)

    def test_only_deleted_manager_returns_deleted(self):
        self.assertQuerySetEqual(
            TestSoftDeletableModel.objects_only_deleted.all(),
            [self.deleted],
        )

    def test_default_manager_delete(self):
        deleted_count = TestSoftDeletableModel.objects.filter(id__in=[self.active_1.id, self.active_2.id]).delete()

        self.assertEqual(deleted_count, 2)
        self.assertEqual(TestSoftDeletableModel.objects.count(), 1)
        self.assertEqual(TestSoftDeletableModel.objects_only_deleted.count(), 3)

    def test_include_deleted_manager_delete(self):
        deleted_count = TestSoftDeletableModel.objects_include_deleted.filter(
            id__in=[self.active_1.id, self.active_2.id]
        ).delete()

        self.assertEqual(deleted_count, 2)
        self.assertEqual(TestSoftDeletableModel.objects.count(), 1)
        self.assertEqual(TestSoftDeletableModel.objects_only_deleted.count(), 3)

    def test_only_deleted_manager_delete(self):
        deleted_count, details = TestSoftDeletableModel.objects_only_deleted.all().delete()
        self.assertEqual(deleted_count, 1)
        self.assertEqual(details, {TestSoftDeletableModel._meta.label: 1})

        self.assertFalse(TestSoftDeletableModel._default_manager.filter(pk=self.deleted.pk).exists())

    def test_include_deleted_manager_restore(self):
        restored_count = TestSoftDeletableModel.objects_include_deleted.restore()

        self.assertEqual(restored_count, 4)
        self.assertEqual(TestSoftDeletableModel.objects.count(), 4)
        self.assertEqual(TestSoftDeletableModel.objects_only_deleted.count(), 0)

    def test_only_deleted_manager_restore(self):
        restored_count = TestSoftDeletableModel.objects_only_deleted.restore()

        self.assertEqual(restored_count, 1)
        self.assertEqual(TestSoftDeletableModel.objects.count(), 4)
        self.assertEqual(TestSoftDeletableModel.objects_only_deleted.count(), 0)

    def test_default_manager_delete_hard_deletes_all_records(self):
        pks = [self.active_1.pk, self.active_2.pk, self.active_3.pk]
        deleted_count, details = TestSoftDeletableModel.objects.delete_hard()

        self.assertEqual(deleted_count, 3)
        self.assertEqual(details, {TestSoftDeletableModel._meta.label: 3})
        self.assertEqual(TestSoftDeletableModel.objects_include_deleted.count(), 1)

        for pk in pks:
            self.assertFalse(TestSoftDeletableModel._base_manager.filter(pk=pk).exists())

        self.assertTrue(TestSoftDeletableModel._base_manager.filter(pk=self.deleted.pk).exists())

    def test_include_deleted_manager_delete_hard_deletes_all_records(self):
        pks = [self.active_1.pk, self.active_2.pk, self.active_3.pk, self.deleted.pk]

        deleted_count, details = TestSoftDeletableModel.objects_include_deleted.delete_hard()

        self.assertEqual(deleted_count, 4)
        self.assertEqual(details, {TestSoftDeletableModel._meta.label: 4})
        self.assertEqual(TestSoftDeletableModel.objects_include_deleted.count(), 0)

        for pk in pks:
            self.assertFalse(TestSoftDeletableModel._base_manager.filter(pk=pk).exists())

    def test_only_deleted_manager_delete_hard_deletes_all_records(self):
        pks = [self.active_1.pk, self.active_2.pk, self.active_3.pk]

        deleted_count, details = TestSoftDeletableModel.objects_only_deleted.delete_hard()

        self.assertEqual(deleted_count, 1)
        self.assertEqual(details, {TestSoftDeletableModel._meta.label: 1})
        self.assertEqual(TestSoftDeletableModel.objects_include_deleted.count(), 3)
        self.assertEqual(TestSoftDeletableModel.objects_only_deleted.count(), 0)

        for pk in pks:
            self.assertTrue(TestSoftDeletableModel._base_manager.filter(pk=pk).exists())

        self.assertFalse(TestSoftDeletableModel._base_manager.filter(pk=self.deleted.pk).exists())

    def test_default_manager_delete_only_affects_filtered_records(self):
        deleted_count = TestSoftDeletableModel.objects.filter(pk=self.active_1.pk).delete()

        self.assertEqual(deleted_count, 1)
        self.assertFalse(TestSoftDeletableModel.objects.filter(pk=self.active_1.pk).exists())
        self.assertTrue(TestSoftDeletableModel.objects.filter(pk=self.active_2.pk).exists())


class SoftDeletableModelTestCase(TestCase):
    def setUp(self):
        self.instance = TestSoftDeletableModel.objects.create(name="Test")

    def test_delete(self):
        self.instance.delete()

        self.assertIsNotNone(self.instance.deleted_at)
        self.assertFalse(TestSoftDeletableModel.objects.filter(pk=self.instance.pk).exists())
        self.assertTrue(TestSoftDeletableModel.objects_include_deleted.filter(pk=self.instance.pk).exists())

    def test_restore(self):
        self.instance.delete()
        self.instance.restore()

        self.assertIsNone(self.instance.deleted_at)
        self.assertTrue(TestSoftDeletableModel.objects.filter(pk=self.instance.pk).exists())

    def test_delete_hard(self):
        pk = self.instance.pk

        deleted_count, details = self.instance.delete_hard()

        self.assertEqual(deleted_count, 1)
        self.assertEqual(details, {TestSoftDeletableModel._meta.label: 1})
        self.assertFalse(TestSoftDeletableModel.objects_include_deleted.filter(pk=pk).exists())
