from iaso.test import IasoMigratorTestCase


class Test0414DirectMigration(IasoMigratorTestCase):
    migrate_from = ("iaso", "0414_add_mobile_stock_home_feature_flag")
    migrate_to = ("iaso", "0415_remove_device_imei_remove_device_projects_and_more")
    num_queries = 36

    def prepare(self):
        Account = self.old_state.apps.get_model("iaso", "Account")
        Device = self.old_state.apps.get_model("iaso", "Device")
        Project = self.old_state.apps.get_model("iaso", "Project")

        account = Account.objects.create(name="account")
        account2 = Account.objects.create(name="account2")

        project = Project.objects.create(name="project", account=account)
        project2 = Project.objects.create(name="project2", account=account2)

        # This device should be linked to "account"
        device = Device.objects.create(imei="device")
        device.projects.set([project])
        # We take the first project for the account so "device2" should be linked to "account" because there is
        # no ordering in the subquery
        device2 = Device.objects.create(imei="device2")
        device2.projects.set([project2, project])
        # This one should not be linked to any account
        Device.objects.create(imei="device3")
        # This one should be deleted
        Device.objects.create(imei=None)

    def test_migration(self):
        Device = self.new_state.apps.get_model("iaso", "Device")
        self.assertEqual(3, Device.objects.count())
        self.assertEqual("account", Device.objects.get(installation_id="device").account.name)
        self.assertEqual("account", Device.objects.get(installation_id="device2").account.name)
        self.assertIsNone(Device.objects.get(installation_id="device3").account)
