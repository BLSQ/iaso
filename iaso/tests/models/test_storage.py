from django.utils import timezone

from iaso.models import Account, StorageDevice
from iaso.test import TestCase


class StorageModelTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="test")

    def test_new_storages_have_correct_status(self):
        """New storages have the OK status, and decent values for the related"""
        storage = StorageDevice.objects.create(account=self.account, type="NFC", customer_chosen_id="123")

        self.assertEqual(storage.status, StorageDevice.OK)
        self.assertEqual(storage.status_reason, "")
        self.assertEqual(storage.status_comment, "")
        self.assertAlmostEqual(
            storage.status_updated_at, storage.created_at, delta=timezone.timedelta(seconds=1)
        )  # tiny time difference is OK
