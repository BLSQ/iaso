from io import StringIO

from django.core import management

from iaso import models as m
from iaso.models.microplanning import PlanningSamplingResult
from iaso.test import TestCase


class DeleteAccountsCommandTestCase(TestCase):
    """
    Builds two fully-populated accounts (one to keep, one to delete) covering both the
    auto-discovered FK graph (Team, Planning, PlanningSamplingResult, Task, EntityType,
    Entity, ExternalCredentials) and the manually-handled M2M gaps (DataSource/SourceVersion/
    OrgUnit, Form) that delete_accounts.py owns.
    """

    @classmethod
    def setUpTestData(cls):
        cls.account_to_keep, cls.data_source_to_keep, cls.version_to_keep, cls.project_to_keep = (
            cls.create_account_datasource_version_project("source kept", "account kept", "project kept")
        )
        cls.kept = cls._populate_account(cls.account_to_keep, cls.version_to_keep, cls.project_to_keep, suffix="kept")

        cls.account_to_delete, cls.data_source_to_delete, cls.version_to_delete, cls.project_to_delete = (
            cls.create_account_datasource_version_project("source deleted", "account deleted", "project deleted")
        )
        cls.deleted = cls._populate_account(
            cls.account_to_delete, cls.version_to_delete, cls.project_to_delete, suffix="deleted"
        )

    @classmethod
    def _populate_account(cls, account, source_version, project, suffix):
        org_unit_type = cls.create_org_unit_type(f"type_{suffix}", [project])
        org_unit_parent = cls.create_valid_org_unit(f"ou_parent_{suffix}", org_unit_type, source_version)
        org_unit_child = m.OrgUnit.objects.create(
            org_unit_type=org_unit_type,
            version=source_version,
            name=f"ou_child_{suffix}",
            parent=org_unit_parent,
        )

        form = m.Form.objects.create(name=f"form_{suffix}")
        project.forms.set([form])

        instance = cls.create_form_instance(project=project, form=form, org_unit=org_unit_child)

        entity_type = m.EntityType.objects.create(name=f"entity_type_{suffix}", account=account, reference_form=form)
        entity = m.Entity.objects.create(entity_type=entity_type, account=account)
        entity.attributes = instance
        entity.save()

        user = cls.create_user_with_profile(username=f"user_{suffix}", account=account)

        team = m.Team.objects.create(project=project, name=f"team_{suffix}", manager=user)
        planning = m.Planning.objects.create(
            project=project, name=f"planning_{suffix}", team=team, org_unit=org_unit_parent
        )
        sampling_result = PlanningSamplingResult.objects.create(planning=planning, parameters={"k": "v"})
        planning.selected_sampling_result = sampling_result
        planning.save()

        task = m.Task.objects.create(account=account, name=f"task_{suffix}", status=m.QUEUED)
        credentials = m.ExternalCredentials.objects.create(
            account=account, name=f"cred_{suffix}", login="login", password="pwd", url="http://example.com"
        )

        return {
            "org_unit_type": org_unit_type,
            "org_unit_parent": org_unit_parent,
            "org_unit_child": org_unit_child,
            "form": form,
            "instance": instance,
            "entity_type": entity_type,
            "entity": entity,
            "user": user,
            "team": team,
            "planning": planning,
            "sampling_result": sampling_result,
            "task": task,
            "credentials": credentials,
        }

    def _assert_account_and_related_data_gone(self, account, data_source, source_version, project, populated):
        self.assertFalse(m.Account.objects.filter(pk=account.pk).exists())
        self.assertFalse(m.DataSource.objects.filter(pk=data_source.pk).exists())
        self.assertFalse(m.SourceVersion.objects.filter(pk=source_version.pk).exists())
        self.assertFalse(m.Project.objects.filter(pk=project.pk).exists())
        self.assertFalse(
            m.OrgUnit.objects.filter(pk__in=[populated["org_unit_parent"].pk, populated["org_unit_child"].pk]).exists()
        )
        self.assertFalse(m.Form.objects_include_deleted.filter(pk=populated["form"].pk).exists())
        self.assertFalse(m.Instance.objects.filter(pk=populated["instance"].pk).exists())
        self.assertFalse(m.EntityType.objects.filter(pk=populated["entity_type"].pk).exists())
        self.assertFalse(m.Entity.objects_include_deleted.filter(pk=populated["entity"].pk).exists())
        self.assertFalse(m.User.objects.filter(pk=populated["user"].pk).exists())
        self.assertFalse(m.Team.objects.filter(pk=populated["team"].pk).exists())
        self.assertFalse(m.Planning.objects.filter(pk=populated["planning"].pk).exists())
        self.assertFalse(PlanningSamplingResult.objects.filter(pk=populated["sampling_result"].pk).exists())
        self.assertFalse(m.Task.objects.filter(pk=populated["task"].pk).exists())
        self.assertFalse(m.ExternalCredentials.objects.filter(pk=populated["credentials"].pk).exists())

    def _assert_account_and_related_data_intact(self, account, data_source, source_version, project, populated):
        self.assertTrue(m.Account.objects.filter(pk=account.pk).exists())
        self.assertTrue(m.DataSource.objects.filter(pk=data_source.pk).exists())
        self.assertTrue(m.SourceVersion.objects.filter(pk=source_version.pk).exists())
        self.assertTrue(m.Project.objects.filter(pk=project.pk).exists())
        self.assertTrue(m.OrgUnit.objects.filter(pk=populated["org_unit_parent"].pk).exists())
        self.assertTrue(m.OrgUnit.objects.filter(pk=populated["org_unit_child"].pk).exists())
        self.assertTrue(m.Form.objects_include_deleted.filter(pk=populated["form"].pk).exists())
        self.assertTrue(m.Instance.objects.filter(pk=populated["instance"].pk).exists())
        self.assertTrue(m.EntityType.objects.filter(pk=populated["entity_type"].pk).exists())
        self.assertTrue(m.Entity.objects_include_deleted.filter(pk=populated["entity"].pk).exists())
        self.assertTrue(m.User.objects.filter(pk=populated["user"].pk).exists())
        self.assertTrue(m.Team.objects.filter(pk=populated["team"].pk).exists())
        self.assertTrue(m.Planning.objects.filter(pk=populated["planning"].pk).exists())
        self.assertTrue(PlanningSamplingResult.objects.filter(pk=populated["sampling_result"].pk).exists())
        self.assertTrue(m.Task.objects.filter(pk=populated["task"].pk).exists())
        self.assertTrue(m.ExternalCredentials.objects.filter(pk=populated["credentials"].pk).exists())

    def test_list_accounts_mode(self):
        management.call_command("delete_accounts", list_accounts=True, stdout=StringIO())

        self.assertTrue(m.Account.objects.filter(pk=self.account_to_keep.pk).exists())
        self.assertTrue(m.Account.objects.filter(pk=self.account_to_delete.pk).exists())

    def test_show_graph_mode_without_for_account_raises(self):
        with self.assertRaises(ValueError):
            management.call_command("delete_accounts", show_graph=True, stdout=StringIO())

    def test_show_graph_mode_with_for_account(self):
        # Should not raise and should not touch any data.
        management.call_command(
            "delete_accounts", show_graph=True, for_account=self.account_to_keep.pk, stdout=StringIO()
        )

        self.assertTrue(m.Account.objects.filter(pk=self.account_to_keep.pk).exists())
        self.assertTrue(m.Account.objects.filter(pk=self.account_to_delete.pk).exists())

    def test_delete_accounts_unknown_id_raises(self):
        missing_id = m.Account.objects.order_by("-pk").first().pk + 1000

        with self.assertRaises(SystemExit):
            management.call_command("delete_accounts", accounts_to_delete=[missing_id], stdout=StringIO())

    def test_dry_run_does_not_delete_anything(self):
        management.call_command(
            "delete_accounts",
            accounts_to_delete=[self.account_to_delete.pk],
            dry_run=True,
            stdout=StringIO(),
        )

        self._assert_account_and_related_data_intact(
            self.account_to_delete,
            self.data_source_to_delete,
            self.version_to_delete,
            self.project_to_delete,
            self.deleted,
        )
        self._assert_account_and_related_data_intact(
            self.account_to_keep, self.data_source_to_keep, self.version_to_keep, self.project_to_keep, self.kept
        )

    def test_delete_specific_account(self):
        management.call_command("delete_accounts", accounts_to_delete=[self.account_to_delete.pk], stdout=StringIO())

        self._assert_account_and_related_data_gone(
            self.account_to_delete,
            self.data_source_to_delete,
            self.version_to_delete,
            self.project_to_delete,
            self.deleted,
        )
        self._assert_account_and_related_data_intact(
            self.account_to_keep, self.data_source_to_keep, self.version_to_keep, self.project_to_keep, self.kept
        )

    def test_keep_single_account(self):
        management.call_command("delete_accounts", account_to_keep=self.account_to_keep.pk, stdout=StringIO())

        self._assert_account_and_related_data_gone(
            self.account_to_delete,
            self.data_source_to_delete,
            self.version_to_delete,
            self.project_to_delete,
            self.deleted,
        )
        self._assert_account_and_related_data_intact(
            self.account_to_keep, self.data_source_to_keep, self.version_to_keep, self.project_to_keep, self.kept
        )
