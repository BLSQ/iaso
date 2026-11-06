from django.contrib.auth.models import AnonymousUser

from iaso.api.devices.mobile.serializer_fields import GetOrCreateDeviceField
from iaso.models import Account, Device, DeviceOwnership, Project
from iaso.models.device import User
from iaso.test import TestCase


class GetOrCreateDeviceFieldTestCase(TestCase):
    def setUp(self):
        self.account = Account.objects.create(name="test")
        self.project = Project.objects.create(name="test", account=self.account)
        self.user = User.objects.create(username="test")

    def test_create_device(self):
        self.assertEqual(Device.objects.count(), 0)
        field = GetOrCreateDeviceField(
            queryset=Device.objects.all(),
            slug_field="installation_id",
        )
        field._context = {"project": self.project, "user": AnonymousUser()}
        field.to_internal_value("123")
        self.assertEqual(Device.objects.count(), 1)
        self.assertEqual(Device.objects.filter(installation_id="123").count(), 1)
        self.assertEqual(DeviceOwnership.objects.filter(device__installation_id="123").count(), 0)

    def test_create_device_with_ownership(self):
        self.assertEqual(Device.objects.count(), 0)
        field = GetOrCreateDeviceField(
            queryset=Device.objects.all(),
            slug_field="installation_id",
        )

        field._context = {"project": self.project, "user": self.user}
        field.to_internal_value("123")
        self.assertEqual(Device.objects.count(), 1)
        self.assertEqual(Device.objects.filter(installation_id="123").count(), 1)
        self.assertEqual(DeviceOwnership.objects.filter(device__installation_id="123").count(), 1)
        self.assertEqual(self.user, DeviceOwnership.objects.get(device__installation_id="123").user)

    def test_do_not_recreate_device(self):
        Device.objects.create(installation_id="123", account=self.account)
        self.assertEqual(Device.objects.count(), 1)
        field = GetOrCreateDeviceField(
            queryset=Device.objects.all(),
            slug_field="installation_id",
        )
        field._context = {"project": self.project, "user": AnonymousUser()}
        field.to_internal_value("123")
        self.assertEqual(Device.objects.count(), 1)
        self.assertEqual(Device.objects.filter(installation_id="123").count(), 1)
