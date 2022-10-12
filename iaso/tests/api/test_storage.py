from time import time

from iaso.models import Account, Form, MONTH, Instance, OrgUnit, Entity, EntityType, StorageDevice, StorageLogEntry
from iaso.test import APITestCase


class StorageAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = Account.objects.create(name="Star Wars")
        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_forms"])

        form_1 = Form.objects.create(name="Hydroponics study", period_type=MONTH, single_per_period=True)

        cls.instance1 = Instance.objects.create(form=form_1)
        cls.instance2 = Instance.objects.create(form=form_1)

        cls.org_unit = OrgUnit.objects.create(name="Akkala")
        entity_type = EntityType.objects.create(name="Type 1")
        cls.entity = Entity.objects.create(name="New Client 3", entity_type=entity_type, account=star_wars)

        cls.existing_storage_device = StorageDevice.objects.create(
            customer_chosen_id="EXISTING_STORAGE",
            account=star_wars,
            type="NFC",
        )

    def test_post_log_needs_authentication(self):
        """POST /api/mobile/storage/log/ is rejected if user is not authenticated."""
        response = self.client.post("/api/mobile/storage/logs/")
        self.assertEqual(response.status_code, 403)  # TODO: Would be better to return 401?

    def test_post_storage_base_new_storage(self):
        """
        Test the base of the POST /api/mobile/storage/log/ endpoint, in the case where the storage device is new.

        - Status is 201 CREATED
        - Correct values added to the database
        """

        self.client.force_authenticate(self.yoda)

        num_devices_before = StorageDevice.objects.count()

        current_timestamp_in_seconds = int(time())
        body_python = [
            {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "storage_id": "NEW_STORAGE",
                "storage_type": "NFC",
                "operation_type": "WRITE_PROFILE",
                "instances": [self.instance1.id, self.instance2.id],
                "org_unit_id": self.org_unit.id,
                "entity_id": self.entity.id,
                "performed_at": current_timestamp_in_seconds,
            }
        ]
        response = self.client.post("/api/mobile/storage/logs/", body_python, format="json")

        self.assertEqual(response.status_code, 201)

        # Ensure the storage device was created was decent values
        self.assertEqual(StorageDevice.objects.count(), num_devices_before + 1)
        the_storage = StorageDevice.objects.latest("id")
        self.assertEqual(the_storage.customer_chosen_id, "NEW_STORAGE")
        self.assertEqual(the_storage.account, self.yoda.iaso_profile.account)
        self.assertEqual(the_storage.type, "NFC")

        # Ensure the log entry was created with decent values
        self.assertEqual(the_storage.log_entries.count(), 1)
        the_log_entry = the_storage.log_entries.first()
        self.assertEqual(str(the_log_entry.id), "123e4567-e89b-12d3-a456-426614174000")
        self.assertEqual(the_log_entry.operation_type, "WRITE_PROFILE")
        # TODO: check the timestamp (in seconds conversion)
        # self.assertEqual(the_log_entry.performed_at, current_timestamp_in_seconds)
        self.assertEqual(the_log_entry.performed_by, self.yoda)
        self.assertQuerysetEqual(the_log_entry.instances.all(), [self.instance1, self.instance2], ordered=False)
        self.assertEqual(the_log_entry.org_unit, self.org_unit)
        self.assertEqual(the_log_entry.entity, self.entity)

    def test_post_storage_base_existing_storage(self):
        """Similar to test_post_storage_base_new_storage, but the storage device already exists."""
        self.client.force_authenticate(self.yoda)

        num_devices_before = StorageDevice.objects.count()

        current_timestamp_in_seconds = int(time())
        body_python = [
            {
                "id": "66664567-e89b-12d3-a456-426614174000",
                "storage_id": "EXISTING_STORAGE",
                "storage_type": "NFC",
                "operation_type": "WRITE_RECORD",
                "instances": [self.instance1.id, self.instance2.id],
                "org_unit_id": self.org_unit.id,
                "entity_id": self.entity.id,
                "performed_at": current_timestamp_in_seconds,
            }
        ]
        response = self.client.post("/api/mobile/storage/logs/", body_python, format="json")
        self.assertEqual(response.status_code, 201)

        # Ensure the no new devices were created
        self.assertEqual(StorageDevice.objects.count(), num_devices_before)

        the_log_entry = StorageLogEntry.objects.get(id="66664567-e89b-12d3-a456-426614174000")
        self.assertEqual(the_log_entry.device, self.existing_storage_device)

        self.assertEqual(the_log_entry.operation_type, "WRITE_RECORD")
        self.assertEqual(the_log_entry.performed_by, self.yoda)
        self.assertQuerysetEqual(the_log_entry.instances.all(), [self.instance1, self.instance2], ordered=False)
        self.assertEqual(the_log_entry.org_unit, self.org_unit)
        self.assertEqual(the_log_entry.entity, self.entity)

    # TODO: POST test post a log with an incorrect storage type fails
    # TODO: POST test post a log with an incorrect operation type fails
    # TODO: POST test mandatory fields are checked on POST
    # TODO: POST test an error is returned if incorrect value for instances, org unit or entity (400)
    # TODO: POST: that the non mandatory fields are actually non mandatory
    # TODO: POST: make sure the device is created in the OK status
