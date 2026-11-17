from iaso.models import Account, MetricType, Workspace
from iaso.test import TestCase


class MetricTypeModelTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="Account")
        cls.other_account = Account.objects.create(name="Other account")
        cls.workspace = Workspace.objects.create(account=cls.account, name="Workspace")
        cls.other_workspace = Workspace.objects.create(account=cls.account, name="Other workspace")

    def test_save_with_workspace_only_sets_account_from_workspace(self):
        metric_type = MetricType.objects.create(workspace=self.workspace, name="Layer", code="layer")

        self.assertEqual(metric_type.account, self.account)

    def test_save_with_account_not_matching_workspace_raises(self):
        with self.assertRaises(ValueError):
            MetricType.objects.create(account=self.other_account, workspace=self.workspace, name="Layer", code="layer")

    def test_visible_in_workspace_includes_own_and_shared_but_not_other_workspace_or_account(self):
        own = MetricType.objects.create(workspace=self.workspace, name="Own", code="own")
        shared = MetricType.objects.create(account=self.account, name="Shared", code="shared")
        MetricType.objects.create(workspace=self.other_workspace, name="Other workspace", code="other_ws")
        MetricType.objects.create(account=self.other_account, name="Other account", code="other_account")

        visible = MetricType.objects.visible_in_workspace(self.workspace)

        self.assertCountEqual(visible, [own, shared])
