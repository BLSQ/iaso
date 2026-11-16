from iaso.test import IasoMigratorTestCase


class Test0417Workspace(IasoMigratorTestCase):
    migrate_from = ("iaso", "0416_alter_corepermissionsupport_options_and_more")
    migrate_to = ("iaso", "0417_workspace")

    def prepare(self):
        Account = self.old_state.apps.get_model("iaso", "Account")
        MetricType = self.old_state.apps.get_model("iaso", "MetricType")

        self.snt_account = Account.objects.create(name="SNT account", modules=["SNT_MALARIA", "DATA_COLLECTION_FORMS"])
        self.other_account = Account.objects.create(name="Other account", modules=["DATA_COLLECTION_FORMS"])
        self.account_without_modules = Account.objects.create(name="No modules", modules=None)
        self.long_name_account = Account.objects.create(name="L" * 300, modules=["SNT_MALARIA"])

        def create_metric_type(account, code, origin):
            return MetricType.objects.create(account=account, name=code, code=code, origin=origin).id

        self.openhexa_layer_id = create_metric_type(self.snt_account, "openhexa", "openhexa")
        self.custom_layer_id = create_metric_type(self.snt_account, "custom", "custom")
        self.other_layer_id = create_metric_type(self.snt_account, "other", "other")
        self.non_snt_custom_layer_id = create_metric_type(self.other_account, "custom", "custom")

    def _layer_workspace_id(self, metric_type_id):
        MetricType = self.new_state.apps.get_model("iaso", "MetricType")
        return MetricType.objects.get(id=metric_type_id).workspace_id

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

    def test_openhexa_layers_stay_at_account_level(self):
        self.assertIsNone(self._layer_workspace_id(self.openhexa_layer_id))

    def test_custom_and_other_layers_move_to_the_snt_account_workspace(self):
        Workspace = self.new_state.apps.get_model("iaso", "Workspace")
        workspace_id = Workspace.objects.get(account_id=self.snt_account.id).id

        self.assertEqual(self._layer_workspace_id(self.custom_layer_id), workspace_id)
        self.assertEqual(self._layer_workspace_id(self.other_layer_id), workspace_id)

    def test_layers_of_an_account_without_workspace_stay_at_account_level(self):
        self.assertIsNone(self._layer_workspace_id(self.non_snt_custom_layer_id))
