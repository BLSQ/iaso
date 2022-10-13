# TODO: need better type annotations in this file
from datetime import datetime
from time import time

from django.utils import timezone

from iaso.models import Account, Form, MONTH, Instance, OrgUnit, Entity, EntityType, StorageDevice, StorageLogEntry
from iaso.test import APITestCase


class StorageAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = Account.objects.create(name="Star Wars")
        star_wars_2 = Account.objects.create(name="Star Wars revival")
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
            status="OK",
        )

        StorageLogEntry.objects.create(
            id="e4200710-bf82-4d29-a29b-6a042f79ef25",
            device=cls.existing_storage_device,
            operation_type="WRITE_PROFILE",
            performed_by=cls.yoda,
            performed_at=datetime(2022, 10, 13, 13, 12, 56, 0, tzinfo=timezone.utc),
        )

        cls.existing_storage_device_2 = StorageDevice.objects.create(
            customer_chosen_id="ANOTHER_EXISTING_STORAGE_BLACKLISTED_STOLEN",
            account=star_wars,
            type="NFC",
            status="BLACKLISTED",
            status_reason="STOLEN",
        )

        cls.existing_storage_device_3 = StorageDevice.objects.create(
            customer_chosen_id="ANOTHER_EXISTING_STORAGE_BLACKLISTED_ABUSE",
            account=star_wars,
            type="SD",
            status="BLACKLISTED",
            status_reason="ABUSE",
        )

        # This one should be invisible to the "yoda" user
        cls.existing_storage_device_another_account = StorageDevice.objects.create(
            customer_chosen_id="EXISTING_STORAGE_ANOTHER_ACCOUNT",
            account=star_wars_2,
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
        post_body = [
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
        response = self.client.post("/api/mobile/storage/logs/", post_body, format="json")

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
        post_body = [
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
        response = self.client.post("/api/mobile/storage/logs/", post_body, format="json")
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

    def test_list_only_authenticated(self):
        """GET /api/storage/ is rejected if user is not authenticated."""
        response = self.client.get("/api/storage/")
        self.assertEqual(response.status_code, 403)

    def test_list_only_own_account(self):
        """GET /api/storage/ only lists the devices associated with the user account"""
        # TODO: implement

    def test_list_base(self):
        """
        GET /api/storage/ return a status 200 and the list of devices in the specified format.

        We also check that devices from other accounts (than the user account) are not returned.

        Endpoint specs: https://bluesquare.atlassian.net/browse/WC2-62
        """
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/storage/")
        self.assertEqual(response.status_code, 200)
        received_json = response.json()
        self.assertEqual(
            received_json,
            {
                "storages": [
                    {
                        "storage_id": "EXISTING_STORAGE",
                        "storage_type": "NFC",
                        "status": {"status": "OK", "reason": "", "comment": ""},
                    },
                    {
                        "storage_id": "ANOTHER_EXISTING_STORAGE_BLACKLISTED_STOLEN",
                        "storage_type": "NFC",
                        "status": {"status": "BLACKLISTED", "reason": "STOLEN", "comment": ""},
                    },
                    {
                        "storage_id": "ANOTHER_EXISTING_STORAGE_BLACKLISTED_ABUSE",
                        "storage_type": "SD",
                        "status": {"status": "BLACKLISTED", "reason": "ABUSE", "comment": ""},
                    },
                ]
            },
        )

    def test_list_filter_by_status(self):
        """GET /api/storage/?status=OK only returns devices with the specified status"""
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/storage/?status=BLACKLISTED")
        received_json = response.json()
        self.assertEqual(
            received_json,
            {
                "storages": [
                    {
                        "storage_id": "ANOTHER_EXISTING_STORAGE_BLACKLISTED_STOLEN",
                        "storage_type": "NFC",
                        "status": {"status": "BLACKLISTED", "reason": "STOLEN", "comment": ""},
                    },
                    {
                        "storage_id": "ANOTHER_EXISTING_STORAGE_BLACKLISTED_ABUSE",
                        "storage_type": "SD",
                        "status": {"status": "BLACKLISTED", "reason": "ABUSE", "comment": ""},
                    },
                ]
            },
        )

    # TODO: list: error 400 if incorrect status/reason/type is requested?

    def test_list_filter_by_reason(self):
        """GET /api/storage/?status=OK only returns devices with the specified status"""
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/storage/?reason=STOLEN")
        received_json = response.json()
        self.assertEqual(
            received_json,
            {
                "storages": [
                    {
                        "storage_id": "ANOTHER_EXISTING_STORAGE_BLACKLISTED_STOLEN",
                        "storage_type": "NFC",
                        "status": {"status": "BLACKLISTED", "reason": "STOLEN", "comment": ""},
                    },
                ]
            },
        )

    def test_list_filter_by_type(self):
        """GET /api/storage/?status=OK only returns devices with the specified type"""
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/storage/?type=NFC")
        received_json = response.json()
        self.assertEqual(
            received_json,
            {
                "storages": [
                    {
                        "storage_id": "EXISTING_STORAGE",
                        "storage_type": "NFC",
                        "status": {"status": "OK", "reason": "", "comment": ""},
                    },
                    {
                        "storage_id": "ANOTHER_EXISTING_STORAGE_BLACKLISTED_STOLEN",
                        "storage_type": "NFC",
                        "status": {"status": "BLACKLISTED", "reason": "STOLEN", "comment": ""},
                    },
                ]
            },
        )

    def test_post_blacklisted_storage_ok(self):
        """
        POST /api/storage/blacklisted with correct parameters and permissions does the job:

        - returns the 204 status
        - perform the requested changes in the database
        """
        self.client.force_authenticate(self.yoda)

        post_body = {
            "storage_id": "EXISTING_STORAGE",
            "storage_type": "NFC",
            "storage_status": {"status": "BLACKLISTED", "reason": "DAMAGED", "comment": "not usable anymore"},
        }
        response = self.client.post("/api/storage/blacklisted/", post_body, format="json")
        self.assertEqual(response.status_code, 204)

        # check that the storage status has been updated (was OK before)
        updated_storage = StorageDevice.objects.get(pk=self.existing_storage_device.pk)
        self.assertEqual(updated_storage.status, "BLACKLISTED")
        self.assertEqual(updated_storage.status_reason, "DAMAGED")
        self.assertEqual(updated_storage.status_comment, "not usable anymore")

        # check that a corresponding log entry has been created

        latest_log_entry_for_storage = updated_storage.log_entries.latest("performed_at")
        self.assertEqual(latest_log_entry_for_storage.operation_type, "CHANGE_STATUS")
        self.assertEqual(latest_log_entry_for_storage.performed_by, self.yoda)
        # TODO: also check the value of performed_at (use mock object?)

    # TODO: test edge cases and errors for the POST /api/storage/blacklisted

    def test_get_logs_for_device_base(self):
        """Test the basics of the logs per device endpoint"""
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/storage/NFC/EXISTING_STORAGE/logs")
        self.assertEqual(response.status_code, 200)
        received_json = response.json()
        self.assertEqual(
            received_json,
            {
                "storage_id": "EXISTING_STORAGE",
                "storage_type": "NFC",
                "status": {"status": "OK", "reason": "", "comment": ""},
                "logs": [
                    {
                        "id": "e4200710-bf82-4d29-a29b-6a042f79ef25",
                        "storage_id": "EXISTING_STORAGE",
                        "storage_type": "NFC",
                        "operation_type": "WRITE_PROFILE",
                        "instances": [],
                        "org_unit": None,
                        "entity": None,
                        "performed_at": "2022-10-13T13:12:56Z",
                    }
                ],
            },
        )

    def test_get_blacklisted_devices(self):
        """Test the basics of the GET /api/mobile/storage/blacklisted endpoint"""
        response = self.client.get("/api/mobile/storage/blacklisted/")
        self.assertEqual(response.status_code, 200)
        received_json = response.json()
        self.assertEqual(
            received_json,
            {
                "storages": [
                    {
                        "storage_id": "ANOTHER_EXISTING_STORAGE_BLACKLISTED_STOLEN",
                        "storage_type": "NFC",
                        "status": {"status": "BLACKLISTED", "reason": "STOLEN", "comment": ""},
                    },
                    {
                        "storage_id": "ANOTHER_EXISTING_STORAGE_BLACKLISTED_ABUSE",
                        "storage_type": "SD",
                        "status": {"status": "BLACKLISTED", "reason": "ABUSE", "comment": ""},
                    },
                ]
            },
        )
