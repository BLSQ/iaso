from iaso.test import IasoMigratorTestCase


class Test0415CreateFirstSntWorkspaces(IasoMigratorTestCase):
    migrate_from = ("iaso", "0416_workspace")
    migrate_to = ("iaso", "0417_create_first_snt_workspaces")

    def prepare(self):
        Account = self.old_state.apps.get_model("iaso", "Account")
        Workspace = self.old_state.apps.get_model("iaso", "Workspace")

        self.snt_account = Account.objects.create(name="SNT account", modules=["SNT_MALARIA", "DATA_COLLECTION_FORMS"])
        self.other_account = Account.objects.create(name="Other account", modules=["DATA_COLLECTION_FORMS"])
        self.account_without_modules = Account.objects.create(name="No modules", modules=None)
        self.long_name_account = Account.objects.create(name="L" * 300, modules=["SNT_MALARIA"])
        self.snt_account_with_workspace = Account.objects.create(name="Already set up", modules=["SNT_MALARIA"])
        self.existing_workspace = Workspace.objects.create(account=self.snt_account_with_workspace, name="Existing")

    def test_creates_one_workspace_named_after_each_snt_account_only(self):
        Workspace = self.new_state.apps.get_model("iaso", "Workspace")

        workspace = Workspace.objects.get(account_id=self.snt_account.id)
        self.assertEqual(workspace.name, "SNT account")
        self.assertIsNone(workspace.created_by)
        self.assertIsNone(workspace.source_workspace)

        self.assertFalse(Workspace.objects.filter(account_id=self.other_account.id).exists())
        self.assertFalse(Workspace.objects.filter(account_id=self.account_without_modules.id).exists())

    def test_truncates_long_account_names(self):
        Workspace = self.new_state.apps.get_model("iaso", "Workspace")

        self.assertEqual(Workspace.objects.get(account_id=self.long_name_account.id).name, "L" * 255)

    def test_keeps_existing_workspace_without_adding_another(self):
        Workspace = self.new_state.apps.get_model("iaso", "Workspace")

        workspaces = Workspace.objects.filter(account_id=self.snt_account_with_workspace.id)
        self.assertEqual(list(workspaces.values_list("id", flat=True)), [self.existing_workspace.id])
