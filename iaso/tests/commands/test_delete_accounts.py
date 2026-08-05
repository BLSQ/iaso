from django.contrib.contenttypes.models import ContentType
from django.contrib.sessions.models import Session
from django.core import management
from django.test import TransactionTestCase
from django.utils import timezone

from hat.api_import.models import APIImport
from hat.audit.models import Modification
from iaso import models as m
from iaso.management.commands.delete_accounts import MODE_DELETE_ACCOUNTS, MODE_KEEP_SINGLE_ACCOUNT
from iaso.models.microplanning import PlanningSamplingResult
from iaso.test import IasoTestCaseMixin


class DeleteAccountsCommandTestCase(TransactionTestCase, IasoTestCaseMixin):
    """
    Builds two fully-populated accounts (one to keep, one to delete) covering both the
    auto-discovered FK graph (Team, Planning, PlanningSamplingResult, Task, EntityType,
    Entity, ExternalCredentials) and the out-of-graph M2M gaps (DataSource/SourceVersion/
    OrgUnit, Form, OrgUnitType) that delete_accounts.py owns.
    """

    def setUp(self):
        self.account_to_keep, self.data_source_to_keep, self.version_to_keep, self.project_to_keep = (
            self.create_account_datasource_version_project("source kept", "account kept", "project kept")
        )
        self.kept = self._populate_account(
            self.account_to_keep, self.version_to_keep, self.project_to_keep, suffix="kept"
        )

        self.account_to_delete, self.data_source_to_delete, self.version_to_delete, self.project_to_delete = (
            self.create_account_datasource_version_project("source deleted", "account deleted", "project deleted")
        )
        self.deleted = self._populate_account(
            self.account_to_delete, self.version_to_delete, self.project_to_delete, suffix="deleted"
        )

    def _populate_account(self, account, source_version, project, suffix):
        org_unit_type = self.create_org_unit_type(suffix, [project])
        org_unit_parent = self.create_valid_org_unit(f"ou_parent_{suffix}", org_unit_type, source_version)
        org_unit_child = m.OrgUnit.objects.create(
            org_unit_type=org_unit_type,
            version=source_version,
            name=f"ou_child_{suffix}",
            parent=org_unit_parent,
        )

        form = m.Form.objects.create(name=f"form_{suffix}", form_id=f"form_id_{suffix}")
        project.forms.set([form])

        instance = self.create_form_instance(project=project, form=form, org_unit=org_unit_child)

        entity_type = m.EntityType.objects.create(name=f"entity_type_{suffix}", account=account, reference_form=form)
        entity = m.Entity.objects.create(entity_type=entity_type, account=account)
        entity.attributes = instance
        entity.save()

        user = self.create_user_with_profile(username=f"user_{suffix}", account=account)

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
        # APIImport & Modification don't have any real FK to iaso models, but have some kind of FK
        api_import = APIImport.objects.create(json_body={}, headers={"QUERY_STRING": f"app_id={project.app_id}"})
        modification = Modification.objects.create(
            content_type=ContentType.objects.get_for_model(m.Instance),
            object_id=str(instance.pk),
            past_value={},
            new_value={},
            source="test",
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
            "api_import": api_import,
            "modification": modification,
        }

    def _create_unscoped_data(self):
        """
        Data with no usable link to any account, split by *when* the command cleans it up:
        - "pre-deletion" orphans are swept by `_pre_deletion_clean_up`, which runs for both
          --account-to-delete and --account-to-keep.
        - "post-deletion" orphans are only swept by `_post_deletion_clean_up`, which runs
          exclusively in --account-to-keep mode (it assumes a single surviving account).
        """
        pre_deletion_orphans = {
            "instance_no_form": m.Instance.objects.create(form=None),
            "org_unit_no_version": m.OrgUnit.objects.create(name="orphan_ou_no_version"),
        }

        form_no_form_id = m.Form.objects.create(name="orphan_form_no_form_id", form_id=None)
        form_no_form_id.projects.set([self.project_to_keep])

        post_deletion_only_orphans = {
            "form_no_project": m.Form.objects.create(
                name="orphan_form_no_project", form_id="orphan_form_no_project_id"
            ),
            "form_no_form_id": form_no_form_id,
            "device_no_project": m.Device.objects.create(imei="orphan-device"),
            "session": Session.objects.create(
                session_key="orphansessionkey", session_data="", expire_date=timezone.now()
            ),
            "data_source_no_project": m.DataSource.objects.create(name="orphan_data_source"),
            "api_import_no_app_id": APIImport.objects.create(json_body={}, headers={"QUERY_STRING": "foo=bar"}),
            "project_no_account": m.Project.objects.create(
                name="orphan_project_no_account", app_id="orphan.project.no.account"
            ),
            "export_log_orphan": m.ExportLog.objects.create(),
            "export_request_orphan": m.ExportRequest.objects.create(
                instance_count=0, exported_count=0, errored_count=0, last_error_message=""
            ),
            "modification_orphan": Modification.objects.create(
                content_type=ContentType.objects.get_for_model(m.Instance),
                object_id="999999999999",
                past_value={},
                new_value={},
                source="test",
            ),
        }

        return pre_deletion_orphans, post_deletion_only_orphans

    def _assert_account_and_related_data_gone(
        self,
        account,
        data_source,
        source_version,
        project,
        populated,
        mode,
        pre_deletion_orphans=None,
        post_deletion_only_orphans=None,
    ):
        self.assertFalse(m.Account.objects.filter(pk=account.pk).exists())
        self.assertFalse(m.DataSource.objects.filter(pk=data_source.pk).exists())
        self.assertFalse(m.SourceVersion.objects.filter(pk=source_version.pk).exists())
        self.assertFalse(m.Project.objects.filter(pk=project.pk).exists())
        self.assertFalse(
            m.OrgUnit.objects.filter(pk__in=[populated["org_unit_parent"].pk, populated["org_unit_child"].pk]).exists()
        )
        self.assertFalse(m.Instance.objects.filter(pk=populated["instance"].pk).exists())
        self.assertFalse(m.EntityType.objects.filter(pk=populated["entity_type"].pk).exists())
        self.assertFalse(m.Entity.objects_include_deleted.filter(pk=populated["entity"].pk).exists())
        self.assertFalse(m.User.objects.filter(pk=populated["user"].pk).exists())
        self.assertFalse(m.Team.objects.filter(pk=populated["team"].pk).exists())
        self.assertFalse(m.Planning.objects.filter(pk=populated["planning"].pk).exists())
        self.assertFalse(PlanningSamplingResult.objects.filter(pk=populated["sampling_result"].pk).exists())
        self.assertFalse(m.Task.objects.filter(pk=populated["task"].pk).exists())
        self.assertFalse(m.ExternalCredentials.objects.filter(pk=populated["credentials"].pk).exists())
        self.assertFalse(APIImport.objects.filter(pk=populated["api_import"].pk).exists())
        self.assertFalse(m.Form.objects_include_deleted.filter(pk=populated["form"].pk).exists())
        self.assertFalse(Modification.objects.filter(pk=populated["modification"].pk).exists())
        self.assertFalse(m.OrgUnitType.objects.filter(pk=populated["org_unit_type"].pk).exists())

        # Everything below depends on whether `_post_deletion_clean_up` ran, which is
        # exclusive to --account-to-keep mode.
        post_deletion_cleanup_ran = mode == MODE_KEEP_SINGLE_ACCOUNT
        assertion = self.assertFalse if post_deletion_cleanup_ran else self.assertTrue

        if pre_deletion_orphans is not None:
            self.assertFalse(m.Instance.objects.filter(pk=pre_deletion_orphans["instance_no_form"].pk).exists())
            self.assertFalse(m.OrgUnit.objects.filter(pk=pre_deletion_orphans["org_unit_no_version"].pk).exists())

        if post_deletion_only_orphans is not None:
            assertion(
                m.Form.objects_include_deleted.filter(pk=post_deletion_only_orphans["form_no_project"].pk).exists()
            )
            assertion(
                m.Form.objects_include_deleted.filter(pk=post_deletion_only_orphans["form_no_form_id"].pk).exists()
            )
            assertion(m.Device.objects.filter(pk=post_deletion_only_orphans["device_no_project"].pk).exists())
            assertion(Session.objects.filter(pk=post_deletion_only_orphans["session"].pk).exists())
            assertion(m.DataSource.objects.filter(pk=post_deletion_only_orphans["data_source_no_project"].pk).exists())
            assertion(APIImport.objects.filter(pk=post_deletion_only_orphans["api_import_no_app_id"].pk).exists())
            assertion(m.Project.objects.filter(pk=post_deletion_only_orphans["project_no_account"].pk).exists())
            assertion(m.ExportLog.objects.filter(pk=post_deletion_only_orphans["export_log_orphan"].pk).exists())
            assertion(
                m.ExportRequest.objects.filter(pk=post_deletion_only_orphans["export_request_orphan"].pk).exists()
            )
            assertion(Modification.objects.filter(pk=post_deletion_only_orphans["modification_orphan"].pk).exists())

    def _assert_account_and_related_data_intact(
        self,
        account,
        data_source,
        source_version,
        project,
        populated,
        pre_deletion_orphans=None,
        post_deletion_only_orphans=None,
    ):
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
        self.assertTrue(APIImport.objects.filter(pk=populated["api_import"].pk).exists())
        self.assertTrue(Modification.objects.filter(pk=populated["modification"].pk).exists())
        self.assertTrue(m.OrgUnitType.objects.filter(pk=populated["org_unit_type"].pk).exists())

        if pre_deletion_orphans is not None:
            self.assertTrue(m.Instance.objects.filter(pk=pre_deletion_orphans["instance_no_form"].pk).exists())
            self.assertTrue(m.OrgUnit.objects.filter(pk=pre_deletion_orphans["org_unit_no_version"].pk).exists())

        if post_deletion_only_orphans is not None:
            self.assertTrue(
                m.Form.objects_include_deleted.filter(pk=post_deletion_only_orphans["form_no_project"].pk).exists()
            )
            self.assertTrue(
                m.Form.objects_include_deleted.filter(pk=post_deletion_only_orphans["form_no_form_id"].pk).exists()
            )
            self.assertTrue(m.Device.objects.filter(pk=post_deletion_only_orphans["device_no_project"].pk).exists())
            self.assertTrue(Session.objects.filter(pk=post_deletion_only_orphans["session"].pk).exists())
            self.assertTrue(
                m.DataSource.objects.filter(pk=post_deletion_only_orphans["data_source_no_project"].pk).exists()
            )
            self.assertTrue(APIImport.objects.filter(pk=post_deletion_only_orphans["api_import_no_app_id"].pk).exists())
            self.assertTrue(m.Project.objects.filter(pk=post_deletion_only_orphans["project_no_account"].pk).exists())
            self.assertTrue(m.ExportLog.objects.filter(pk=post_deletion_only_orphans["export_log_orphan"].pk).exists())
            self.assertTrue(
                m.ExportRequest.objects.filter(pk=post_deletion_only_orphans["export_request_orphan"].pk).exists()
            )
            self.assertTrue(
                Modification.objects.filter(pk=post_deletion_only_orphans["modification_orphan"].pk).exists()
            )

    def test_list_accounts_mode(self):
        management.call_command("delete_accounts", list_accounts=True, verbosity=0)

        self.assertTrue(m.Account.objects.filter(pk=self.account_to_keep.pk).exists())
        self.assertTrue(m.Account.objects.filter(pk=self.account_to_delete.pk).exists())

    def test_show_graph_mode_without_for_account_raises(self):
        with self.assertRaises(ValueError):
            management.call_command("delete_accounts", show_graph=True, verbosity=0)

    def test_show_graph_mode_with_for_account(self):
        # Should not raise and should not touch any data.
        management.call_command("delete_accounts", show_graph=True, for_account=self.account_to_keep.pk, verbosity=0)

        self.assertTrue(m.Account.objects.filter(pk=self.account_to_keep.pk).exists())
        self.assertTrue(m.Account.objects.filter(pk=self.account_to_delete.pk).exists())

    def test_delete_accounts_unknown_id_raises(self):
        missing_id = m.Account.objects.order_by("-pk").first().pk + 1000

        with self.assertRaises(SystemExit):
            management.call_command("delete_accounts", accounts_to_delete=[missing_id], verbosity=0)

    def test_keep_single_account_unknown_id_raises(self):
        missing_id = m.Account.objects.order_by("-pk").first().pk + 1000

        with self.assertRaises(SystemExit):
            management.call_command("delete_accounts", account_to_keep=missing_id, verbosity=0)

    def test_show_graph_mode_unknown_for_account_raises(self):
        missing_id = m.Account.objects.order_by("-pk").first().pk + 1000

        with self.assertRaises(SystemExit):
            management.call_command("delete_accounts", show_graph=True, for_account=missing_id, verbosity=0)

    def test_dry_run_delete_accounts_mode_does_not_delete_anything(self):
        pre_deletion_orphans, post_deletion_only_orphans = self._create_unscoped_data()

        management.call_command(
            "delete_accounts",
            accounts_to_delete=[self.account_to_delete.pk],
            dry_run=True,
            verbosity=0,
        )

        self._assert_account_and_related_data_intact(
            self.account_to_delete,
            self.data_source_to_delete,
            self.version_to_delete,
            self.project_to_delete,
            self.deleted,
            pre_deletion_orphans=pre_deletion_orphans,
            post_deletion_only_orphans=post_deletion_only_orphans,
        )
        self._assert_account_and_related_data_intact(
            self.account_to_keep, self.data_source_to_keep, self.version_to_keep, self.project_to_keep, self.kept
        )

    def test_dry_run_keep_single_account_mode_does_not_delete_anything(self):
        pre_deletion_orphans, post_deletion_only_orphans = self._create_unscoped_data()

        management.call_command(
            "delete_accounts",
            account_to_keep=self.account_to_keep.pk,
            dry_run=True,
            verbosity=0,
        )

        self._assert_account_and_related_data_intact(
            self.account_to_delete,
            self.data_source_to_delete,
            self.version_to_delete,
            self.project_to_delete,
            self.deleted,
            pre_deletion_orphans=pre_deletion_orphans,
            post_deletion_only_orphans=post_deletion_only_orphans,
        )
        self._assert_account_and_related_data_intact(
            self.account_to_keep, self.data_source_to_keep, self.version_to_keep, self.project_to_keep, self.kept
        )

    def test_delete_specific_account(self):
        pre_deletion_orphans, post_deletion_only_orphans = self._create_unscoped_data()

        management.call_command("delete_accounts", accounts_to_delete=[self.account_to_delete.pk], verbosity=0)

        self._assert_account_and_related_data_gone(
            self.account_to_delete,
            self.data_source_to_delete,
            self.version_to_delete,
            self.project_to_delete,
            self.deleted,
            mode=MODE_DELETE_ACCOUNTS,
            pre_deletion_orphans=pre_deletion_orphans,
            post_deletion_only_orphans=post_deletion_only_orphans,
        )
        self._assert_account_and_related_data_intact(
            self.account_to_keep, self.data_source_to_keep, self.version_to_keep, self.project_to_keep, self.kept
        )

    def test_keep_single_account(self):
        pre_deletion_orphans, post_deletion_only_orphans = self._create_unscoped_data()

        management.call_command("delete_accounts", account_to_keep=self.account_to_keep.pk, verbosity=0)

        self._assert_account_and_related_data_gone(
            self.account_to_delete,
            self.data_source_to_delete,
            self.version_to_delete,
            self.project_to_delete,
            self.deleted,
            mode=MODE_KEEP_SINGLE_ACCOUNT,
            pre_deletion_orphans=pre_deletion_orphans,
            post_deletion_only_orphans=post_deletion_only_orphans,
        )
        self._assert_account_and_related_data_intact(
            self.account_to_keep, self.data_source_to_keep, self.version_to_keep, self.project_to_keep, self.kept
        )
