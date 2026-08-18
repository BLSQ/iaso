from decimal import Decimal
from io import StringIO

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group as AuthGroup
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import Point
from django.contrib.sessions.models import Session
from django.contrib.sites.models import Site
from django.core import management
from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from django_sql_dashboard.models import Dashboard as SqlDashboard

from hat.api_import.models import APIImport
from hat.audit.models import Modification
from iaso import models as m
from iaso.management.commands.delete_accounts import MODE_DELETE_ACCOUNTS, MODE_KEEP_SINGLE_ACCOUNT
from iaso.models.data_store import JsonDataStore
from iaso.models.json_config import Config
from iaso.models.microplanning import Assignment, PlanningSamplingResult
from iaso.test import IasoTestCaseMixin


class DeleteAccountsCommandTestCase(TransactionTestCase, IasoTestCaseMixin):
    """
    Builds two fully-populated accounts (one to keep, one to delete) covering the
    auto-discovered FK graph, the out-of-graph M2M gaps (DataSource/SourceVersion/OrgUnit,
    Form, OrgUnitType) that delete_accounts.py owns, and every other iaso model — so that
    each one is exercised by these tests, whether it's expected to be deleted with the
    account or to survive.
    """

    def setUp(self):
        self.account_to_keep, self.data_source_to_keep, self.version_to_keep, self.project_to_keep = (
            self.create_account_datasource_version_project("source kept", "account kept", "project kept")
        )
        self.account_to_delete, self.data_source_to_delete, self.version_to_delete, self.project_to_delete = (
            self.create_account_datasource_version_project("source deleted", "account deleted", "project deleted")
        )

    def _populate_account(self, account, source_version, project, suffix):
        data_source = source_version.data_source

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

        # 5 instances, so Instance deletion for this account has more than one row —
        # exercises _delete_qs_in_chunks' chunking loop beyond a single iteration.
        instances = [self.create_form_instance(project=project, form=form, org_unit=org_unit_child) for _ in range(5)]

        entity_type = m.EntityType.objects.create(name=f"entity_type_{suffix}", account=account, reference_form=form)
        entity = m.Entity.objects.create(entity_type=entity_type, account=account)
        entity.attributes = instances[0]
        entity.save()
        entity_2 = m.Entity.objects.create(entity_type=entity_type, account=account)

        user = self.create_user_with_profile(username=f"user_{suffix}", account=account)
        profile = user.iaso_profile

        # 3-level parent hierarchy (Team.parent is a self-referential PROTECT FK) with
        # `users` M2M set on every level, so a batch delete of the whole team set both
        # hits the raw_delete IntegrityError fallback (team_users join table) and a
        # multi-level ProtectedError chain (IA-5268 regression: only 1 level was
        # auto-unblocked, deeper hierarchies crashed the whole account deletion).
        team_grandparent = m.Team.objects.create(project=project, name=f"team_grandparent_{suffix}", manager=user)
        team_grandparent.users.set([user])
        team_parent = m.Team.objects.create(
            project=project, name=f"team_parent_{suffix}", manager=user, parent=team_grandparent
        )
        team_parent.users.set([user])
        team = m.Team.objects.create(project=project, name=f"team_{suffix}", manager=user, parent=team_parent)
        team.users.set([user])
        planning = m.Planning.objects.create(
            project=project, name=f"planning_{suffix}", team=team, org_unit=org_unit_parent
        )
        sampling_result = PlanningSamplingResult.objects.create(planning=planning, parameters={"k": "v"})
        planning.selected_sampling_result = sampling_result
        planning.save()
        assignment = Assignment.objects.create(planning=planning, org_unit=org_unit_child, user=user, team=team)

        task = m.Task.objects.create(account=account, name=f"task_{suffix}", status=m.QUEUED)
        credentials = m.ExternalCredentials.objects.create(
            account=account, name=f"cred_{suffix}", login="login", password="pwd", url="http://example.com"
        )
        # APIImport & Modification don't have any real FK to iaso models, but have some kind of FK
        api_import = APIImport.objects.create(json_body={}, headers={"QUERY_STRING": f"app_id={project.app_id}"})
        modification = Modification.objects.create(
            content_type=ContentType.objects.get_for_model(m.Instance),
            object_id=str(instances[0].pk),
            past_value={},
            new_value={},
            source="test",
        )

        # Global catalog-style models: no real FK to account/project at all, only ever
        # linked via M2M — the link disappears with the account, the catalog entry itself
        # (shared across every account) survives.
        account_feature_flag = m.AccountFeatureFlag.objects.create(name=f"aff_{suffix}", code=f"aff_{suffix}")
        account.feature_flags.add(account_feature_flag)
        feature_flag = m.FeatureFlag.objects.create(name=f"ff_{suffix}", code=f"ff_{suffix}")
        project_feature_flags = m.ProjectFeatureFlags.objects.create(featureflag=feature_flag, project=project)
        config = Config.objects.create(slug=f"config-{suffix}", content={})
        # django_sql_dashboard is a third-party app with no FK to Account at all — its FK
        # to User must still be cleared before that user is deleted (IA-5268 regression:
        # Postgres raised an IntegrityError on commit because that FK wasn't nulled first).
        sql_dashboard = SqlDashboard.objects.create(slug=f"dashboard-{suffix}", owned_by=user)
        openhexa_instance = m.OpenHEXAInstance.objects.create(
            name=f"openhexa_instance_{suffix}", url="https://openhexa.example.test", token="tok"
        )
        openhexa_workspace = m.OpenHEXAWorkspace.objects.create(
            openhexa_instance=openhexa_instance, account=account, slug=f"workspace-{suffix}"
        )

        device = m.Device.objects.create(imei=f"imei_{suffix}")
        device.projects.set([project])
        device_ownership = m.DeviceOwnership.objects.create(device=device, project=project, user=user)
        device_position = m.DevicePosition.objects.create(
            device=device,
            location=Point(0, 0, 0, srid=4326),
            transport=m.DevicePosition.CAR,
            accuracy=Decimal("1.5"),
            captured_at=timezone.now(),
        )

        matching_algorithm = m.MatchingAlgorithm.objects.create(name=f"algo_{suffix}", description="test")
        matching_algorithm.projects.set([project])
        record_type = m.RecordType.objects.create(name=f"record_type_{suffix}", description="test")
        record_type.projects.set([project])
        record = m.Record.objects.create(
            value=Decimal("1"), version=source_version, org_unit=org_unit_child, record_type=record_type
        )
        algorithm_run = m.AlgorithmRun.objects.create(
            algorithm=matching_algorithm, version_1=source_version, version_2=source_version
        )
        link = m.Link.objects.create(destination=org_unit_child, source=org_unit_parent, algorithm_run=algorithm_run)

        group = m.Group.objects.create(name=f"group_{suffix}", source_version=source_version)
        group.org_units.set([org_unit_child])
        group_set = m.GroupSet.objects.create(name=f"group_set_{suffix}", source_version=source_version)
        group_set.groups.set([group])

        mapping = m.Mapping.objects.create(
            name=f"mapping_{suffix}", data_source=data_source, form=form, mapping_type=m.AGGREGATE
        )
        form_version = m.FormVersion.objects.create(form=form, file="test.xml", version_id="v1", form_descriptor={})
        mapping_version = m.MappingVersion.objects.create(
            form_version=form_version, mapping=mapping, name=f"mv_{suffix}", json={}
        )
        form_predefined_filter = m.FormPredefinedFilter.objects.create(
            form=form, name=f"filter_{suffix}", short_name=f"f_{suffix}", json_logic={}
        )
        form_attachment = m.FormAttachment.objects.create(form=form, name=f"attachment_{suffix}", file="test.txt")
        temporary_form = m.TemporaryForm.objects.create(xls_file="form_ai/test.xlsx", user=user, account=account)
        import_gpkg = m.ImportGPKG.objects.create(file="test.gpkg", data_source=data_source)

        instance_file = m.InstanceFile.objects.create(instance=instances[0], name="file", file="test_file.jpg")
        instance_lock = m.InstanceLock.objects.create(
            instance=instances[0], locked_by=user, top_org_unit=org_unit_parent
        )

        json_data_store = JsonDataStore.objects.create(
            slug=f"jds-{suffix}", content={}, account=account, org_unit=org_unit_child
        )

        metric_type = m.MetricType.objects.create(account=account, name=f"metric_{suffix}", code=f"metric_{suffix}")
        metric_value = m.MetricValue.objects.create(
            metric_type=metric_type, org_unit=org_unit_child, year=2024, value=1.0
        )

        org_unit_reference_instance = m.OrgUnitReferenceInstance.objects.create(
            org_unit=org_unit_child, form=form, instance=instances[0]
        )
        org_unit_change_request = m.OrgUnitChangeRequest.objects.create(org_unit=org_unit_child)
        org_unit_change_request_configuration = m.OrgUnitChangeRequestConfiguration.objects.create(
            project=project, org_unit_type=org_unit_type, type="creation"
        )

        page = m.Page.objects.create(name=f"page_{suffix}", slug=f"page-{suffix}", account=account)

        payment_lot = m.PaymentLot.objects.create(name=f"payment_lot_{suffix}", created_by=user, task=task)
        payment = m.Payment.objects.create(user=user, payment_lot=payment_lot)
        potential_payment = m.PotentialPayment.objects.create(user=user, payment_lot=payment_lot, task=task)

        report_version = m.ReportVersion.objects.create(
            file="report.pdf", name=f"report_version_{suffix}", created_by=user
        )
        report = m.Report.objects.create(name=f"report_{suffix}", published_version=report_version, project=project)

        stock_keeping_unit = m.StockKeepingUnit.objects.create(
            name=f"sku_{suffix}", short_name=f"sku_{suffix}", account=account
        )
        stock_keeping_unit.projects.set([project])
        stock_keeping_unit_children = m.StockKeepingUnitChildren.objects.create(
            parent=stock_keeping_unit, child=stock_keeping_unit, value=1
        )
        stock_item = m.StockItem.objects.create(org_unit=org_unit_child, sku=stock_keeping_unit)
        stock_rules_version = m.StockRulesVersion.objects.create(account=account, name=f"stock_rules_{suffix}")
        stock_item_rule = m.StockItemRule.objects.create(
            sku=stock_keeping_unit, form=form, question="q1", version=stock_rules_version
        )
        stock_ledger_item = m.StockLedgerItem.objects.create(
            sku=stock_keeping_unit,
            org_unit=org_unit_child,
            rule=stock_item_rule,
            submission=instances[0],
            value=1,
            created_by=user,
            created_at=timezone.now(),
        )

        storage_device = m.StorageDevice.objects.create(
            customer_chosen_id=f"nfc_{suffix}", account=account, type=m.StorageDevice.NFC
        )
        storage_log_entry = m.StorageLogEntry.objects.create(
            device=storage_device,
            operation_type=m.StorageLogEntry.READ,
            performed_at=timezone.now(),
            performed_by=user,
        )
        storage_password = m.StoragePassword.objects.create(password="secret", project=project)

        task_log = m.TaskLog.objects.create(task=task, message="log message")

        user_model = get_user_model()
        main_user = user_model.objects.create(username=f"main_user_{suffix}")
        tenant_user = m.TenantUser.objects.create(main_user=main_user, account_user=user)

        auth_group = AuthGroup.objects.create(name=f"auth_group_{suffix}")
        user_role = m.UserRole.objects.create(account=account, group=auth_group)

        workflow = m.Workflow.objects.create(entity_type=entity_type)
        workflow_version = m.WorkflowVersion.objects.create(workflow=workflow, name=f"wfv_{suffix}")
        workflow_followup = m.WorkflowFollowup.objects.create(workflow_version=workflow_version)
        workflow_followup.forms.set([form])
        workflow_change = m.WorkflowChange.objects.create(form=form, workflow_version=workflow_version)

        validation_workflow = m.ValidationWorkflow.objects.create(account=account, name=f"validation_workflow_{suffix}")
        validation_node_template = m.ValidationNodeTemplate.objects.create(
            workflow=validation_workflow, name=f"validation_node_template_{suffix}"
        )
        validation_node = m.ValidationNode.objects.create(instance=instances[0], node=validation_node_template)

        comment_iaso = m.CommentIaso.objects.create(
            content_type=ContentType.objects.get_for_model(m.OrgUnit),
            object_pk=str(org_unit_child.pk),
            site=Site.objects.get_current(),
            comment="test comment",
            user=user,
        )

        entity_duplicate_analyzis = m.EntityDuplicateAnalyzis.objects.create(task=task)
        entity_duplicate = m.EntityDuplicate.objects.create(entity1=entity, entity2=entity_2)

        other_source_version = m.SourceVersion.objects.create(data_source=data_source, number=2)
        data_source_versions_synchronization = m.DataSourceVersionsSynchronization.objects.create(
            name=f"dsvs_{suffix}",
            source_version_to_update=source_version,
            source_version_to_compare_with=other_source_version,
            account=account,
        )
        bulk_create_user_file = m.BulkCreateUserFile.objects.create(file="test.csv", created_by=user, account=account)

        export_request = m.ExportRequest.objects.create(
            instance_count=0, exported_count=0, errored_count=0, last_error_message=""
        )
        export_status = m.ExportStatus.objects.create(
            export_request=export_request, instance=instances[0], mapping_version=mapping_version
        )
        export_log = m.ExportLog.objects.create()
        export_status.export_logs.set([export_log])

        return {
            "org_unit_type": org_unit_type,
            "org_unit_parent": org_unit_parent,
            "org_unit_child": org_unit_child,
            "form": form,
            "instances": instances,
            "entity_type": entity_type,
            "entity": entity,
            "entity_2": entity_2,
            "user": user,
            "profile": profile,
            "team": team,
            "team_parent": team_parent,
            "team_grandparent": team_grandparent,
            "planning": planning,
            "sampling_result": sampling_result,
            "assignment": assignment,
            "task": task,
            "credentials": credentials,
            "api_import": api_import,
            "modification": modification,
            "account_feature_flag": account_feature_flag,
            "feature_flag": feature_flag,
            "project_feature_flags": project_feature_flags,
            "config": config,
            "openhexa_instance": openhexa_instance,
            "openhexa_workspace": openhexa_workspace,
            "sql_dashboard": sql_dashboard,
            "device": device,
            "device_ownership": device_ownership,
            "device_position": device_position,
            "matching_algorithm": matching_algorithm,
            "record_type": record_type,
            "record": record,
            "algorithm_run": algorithm_run,
            "link": link,
            "group": group,
            "group_set": group_set,
            "mapping": mapping,
            "form_version": form_version,
            "mapping_version": mapping_version,
            "form_predefined_filter": form_predefined_filter,
            "form_attachment": form_attachment,
            "temporary_form": temporary_form,
            "import_gpkg": import_gpkg,
            "instance_file": instance_file,
            "instance_lock": instance_lock,
            "json_data_store": json_data_store,
            "metric_type": metric_type,
            "metric_value": metric_value,
            "org_unit_reference_instance": org_unit_reference_instance,
            "org_unit_change_request": org_unit_change_request,
            "org_unit_change_request_configuration": org_unit_change_request_configuration,
            "page": page,
            "payment_lot": payment_lot,
            "payment": payment,
            "potential_payment": potential_payment,
            "report_version": report_version,
            "report": report,
            "stock_keeping_unit": stock_keeping_unit,
            "stock_keeping_unit_children": stock_keeping_unit_children,
            "stock_item": stock_item,
            "stock_rules_version": stock_rules_version,
            "stock_item_rule": stock_item_rule,
            "stock_ledger_item": stock_ledger_item,
            "storage_device": storage_device,
            "storage_log_entry": storage_log_entry,
            "storage_password": storage_password,
            "task_log": task_log,
            "main_user": main_user,
            "tenant_user": tenant_user,
            "auth_group": auth_group,
            "user_role": user_role,
            "workflow": workflow,
            "workflow_version": workflow_version,
            "workflow_followup": workflow_followup,
            "workflow_change": workflow_change,
            "validation_workflow": validation_workflow,
            "validation_node_template": validation_node_template,
            "validation_node": validation_node,
            "comment_iaso": comment_iaso,
            "entity_duplicate_analyzis": entity_duplicate_analyzis,
            "entity_duplicate": entity_duplicate,
            "data_source_versions_synchronization": data_source_versions_synchronization,
            "bulk_create_user_file": bulk_create_user_file,
            "export_request": export_request,
            "export_status": export_status,
            "export_log": export_log,
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
        other_models,
        mode,
        pre_deletion_orphans=None,
        post_deletion_only_orphans=None,
    ):
        self.assertFalse(m.Account.objects.filter(pk=account.pk).exists())
        self.assertFalse(m.AccountFeatureFlag.objects.filter(pk=other_models["account_feature_flag"].pk).exists())
        self.assertFalse(m.AlgorithmRun.objects.filter(pk=other_models["algorithm_run"].pk).exists())
        self.assertFalse(APIImport.objects.filter(pk=other_models["api_import"].pk).exists())
        self.assertFalse(Assignment.objects.filter(pk=other_models["assignment"].pk).exists())
        self.assertFalse(m.BulkCreateUserFile.objects.filter(pk=other_models["bulk_create_user_file"].pk).exists())
        self.assertFalse(m.CommentIaso.objects.filter(pk=other_models["comment_iaso"].pk).exists())
        self.assertFalse(m.DataSource.objects.filter(pk=data_source.pk).exists())
        self.assertFalse(
            m.DataSourceVersionsSynchronization.objects.filter(
                pk=other_models["data_source_versions_synchronization"].pk
            ).exists()
        )
        self.assertFalse(m.Device.objects.filter(pk=other_models["device"].pk).exists())
        self.assertFalse(m.DeviceOwnership.objects.filter(pk=other_models["device_ownership"].pk).exists())
        self.assertFalse(m.DevicePosition.objects.filter(pk=other_models["device_position"].pk).exists())
        self.assertFalse(m.Entity.objects_include_deleted.filter(pk=other_models["entity"].pk).exists())
        self.assertFalse(m.Entity.objects_include_deleted.filter(pk=other_models["entity_2"].pk).exists())
        self.assertFalse(m.EntityDuplicate.objects.filter(pk=other_models["entity_duplicate"].pk).exists())
        self.assertFalse(
            m.EntityDuplicateAnalyzis.objects.filter(pk=other_models["entity_duplicate_analyzis"].pk).exists()
        )
        self.assertFalse(m.EntityType.objects.filter(pk=other_models["entity_type"].pk).exists())
        self.assertFalse(m.ExportLog.objects.filter(pk=other_models["export_log"].pk).exists())
        self.assertFalse(m.ExportRequest.objects.filter(pk=other_models["export_request"].pk).exists())
        self.assertFalse(m.ExportStatus.objects.filter(pk=other_models["export_status"].pk).exists())
        self.assertFalse(m.ExternalCredentials.objects.filter(pk=other_models["credentials"].pk).exists())
        # FeatureFlags are global and never deleted
        self.assertTrue(m.FeatureFlag.objects.filter(pk=other_models["feature_flag"].pk).exists())
        self.assertFalse(m.Form.objects_include_deleted.filter(pk=other_models["form"].pk).exists())
        self.assertFalse(m.FormAttachment.objects.filter(pk=other_models["form_attachment"].pk).exists())
        self.assertFalse(m.FormPredefinedFilter.objects.filter(pk=other_models["form_predefined_filter"].pk).exists())
        self.assertFalse(m.FormVersion.objects.filter(pk=other_models["form_version"].pk).exists())
        self.assertFalse(m.Group.objects.filter(pk=other_models["group"].pk).exists())
        self.assertFalse(m.GroupSet.objects.filter(pk=other_models["group_set"].pk).exists())
        self.assertFalse(m.ImportGPKG.objects.filter(pk=other_models["import_gpkg"].pk).exists())
        self.assertFalse(m.Instance.objects.filter(pk__in=[i.pk for i in other_models["instances"]]).exists())
        self.assertFalse(m.InstanceFile.objects.filter(pk=other_models["instance_file"].pk).exists())
        self.assertFalse(m.InstanceLock.objects.filter(pk=other_models["instance_lock"].pk).exists())
        self.assertFalse(JsonDataStore.objects.filter(pk=other_models["json_data_store"].pk).exists())
        self.assertFalse(m.Link.objects.filter(pk=other_models["link"].pk).exists())
        self.assertFalse(m.Mapping.objects.filter(pk=other_models["mapping"].pk).exists())
        self.assertFalse(m.MappingVersion.objects.filter(pk=other_models["mapping_version"].pk).exists())
        self.assertFalse(m.MatchingAlgorithm.objects.filter(pk=other_models["matching_algorithm"].pk).exists())
        self.assertFalse(m.MetricType.objects.filter(pk=other_models["metric_type"].pk).exists())
        self.assertFalse(m.MetricValue.objects.filter(pk=other_models["metric_value"].pk).exists())
        self.assertFalse(Modification.objects.filter(pk=other_models["modification"].pk).exists())
        self.assertFalse(m.OpenHEXAWorkspace.objects.filter(pk=other_models["openhexa_workspace"].pk).exists())
        self.assertFalse(
            m.OrgUnit.objects.filter(
                pk__in=[other_models["org_unit_parent"].pk, other_models["org_unit_child"].pk]
            ).exists()
        )
        self.assertFalse(m.OrgUnitChangeRequest.objects.filter(pk=other_models["org_unit_change_request"].pk).exists())
        self.assertFalse(
            m.OrgUnitChangeRequestConfiguration.objects.filter(
                pk=other_models["org_unit_change_request_configuration"].pk
            ).exists()
        )
        self.assertFalse(
            m.OrgUnitReferenceInstance.objects.filter(pk=other_models["org_unit_reference_instance"].pk).exists()
        )
        self.assertFalse(m.OrgUnitType.objects.filter(pk=other_models["org_unit_type"].pk).exists())
        self.assertFalse(m.Page.objects.filter(pk=other_models["page"].pk).exists())
        self.assertFalse(m.Payment.objects.filter(pk=other_models["payment"].pk).exists())
        self.assertFalse(m.PaymentLot.objects.filter(pk=other_models["payment_lot"].pk).exists())
        self.assertFalse(m.Planning.objects.filter(pk=other_models["planning"].pk).exists())
        self.assertFalse(PlanningSamplingResult.objects.filter(pk=other_models["sampling_result"].pk).exists())
        self.assertFalse(m.PotentialPayment.objects.filter(pk=other_models["potential_payment"].pk).exists())
        self.assertFalse(m.Profile.objects.filter(pk=other_models["profile"].pk).exists())
        self.assertFalse(m.Project.objects.filter(pk=project.pk).exists())
        self.assertFalse(m.ProjectFeatureFlags.objects.filter(pk=other_models["project_feature_flags"].pk).exists())
        self.assertFalse(m.Record.objects.filter(pk=other_models["record"].pk).exists())
        self.assertFalse(m.RecordType.objects.filter(pk=other_models["record_type"].pk).exists())
        self.assertFalse(m.Report.objects.filter(pk=other_models["report"].pk).exists())
        self.assertFalse(m.ReportVersion.objects.filter(pk=other_models["report_version"].pk).exists())
        self.assertFalse(m.SourceVersion.objects.filter(pk=source_version.pk).exists())
        self.assertFalse(m.StockItem.objects.filter(pk=other_models["stock_item"].pk).exists())
        self.assertFalse(m.StockItemRule.objects.filter(pk=other_models["stock_item_rule"].pk).exists())
        self.assertFalse(m.StockKeepingUnit.objects.filter(pk=other_models["stock_keeping_unit"].pk).exists())
        self.assertFalse(
            m.StockKeepingUnitChildren.objects.filter(pk=other_models["stock_keeping_unit_children"].pk).exists()
        )
        self.assertFalse(m.StockLedgerItem.objects.filter(pk=other_models["stock_ledger_item"].pk).exists())
        self.assertFalse(m.StockRulesVersion.objects.filter(pk=other_models["stock_rules_version"].pk).exists())
        self.assertFalse(m.StorageDevice.objects.filter(pk=other_models["storage_device"].pk).exists())
        self.assertFalse(m.StorageLogEntry.objects.filter(pk=other_models["storage_log_entry"].pk).exists())
        self.assertFalse(m.StoragePassword.objects.filter(pk=other_models["storage_password"].pk).exists())
        self.assertFalse(m.Task.objects.filter(pk=other_models["task"].pk).exists())
        self.assertFalse(m.TaskLog.objects.filter(pk=other_models["task_log"].pk).exists())
        self.assertFalse(
            m.Team.objects.filter(
                pk__in=[
                    other_models["team"].pk,
                    other_models["team_parent"].pk,
                    other_models["team_grandparent"].pk,
                ]
            ).exists()
        )
        self.assertFalse(m.TemporaryForm.objects.filter(pk=other_models["temporary_form"].pk).exists())
        self.assertFalse(m.TenantUser.objects.filter(pk=other_models["tenant_user"].pk).exists())
        self.assertFalse(m.User.objects.filter(pk=other_models["user"].pk).exists())
        self.assertFalse(m.UserRole.objects.filter(pk=other_models["user_role"].pk).exists())
        self.assertFalse(m.ValidationNode.objects.filter(pk=other_models["validation_node"].pk).exists())
        self.assertFalse(
            m.ValidationNodeTemplate.objects.filter(pk=other_models["validation_node_template"].pk).exists()
        )
        self.assertFalse(m.ValidationWorkflow.objects.filter(pk=other_models["validation_workflow"].pk).exists())
        self.assertFalse(m.Workflow.objects.filter(pk=other_models["workflow"].pk).exists())
        self.assertFalse(m.WorkflowChange.objects.filter(pk=other_models["workflow_change"].pk).exists())
        self.assertFalse(m.WorkflowFollowup.objects.filter(pk=other_models["workflow_followup"].pk).exists())
        self.assertFalse(m.WorkflowVersion.objects.filter(pk=other_models["workflow_version"].pk).exists())

        # Everything below depends on whether `_post_deletion_clean_up` ran, which is
        # exclusive to --account-to-keep mode.
        post_deletion_cleanup_ran = mode == MODE_KEEP_SINGLE_ACCOUNT
        assertion = self.assertFalse if post_deletion_cleanup_ran else self.assertTrue

        if post_deletion_cleanup_ran:
            # `_post_deletion_clean_up` wipes every Dashboard row (no FK to Account at all).
            self.assertFalse(SqlDashboard.objects.filter(pk=other_models["sql_dashboard"].pk).exists())
        else:
            # Not wiped in this mode, but its FK to the now-deleted user must be null (IA-5268).
            self.assertIsNone(SqlDashboard.objects.get(pk=other_models["sql_dashboard"].pk).owned_by_id)

        if pre_deletion_orphans is not None:
            self.assertFalse(m.Instance.objects.filter(pk=pre_deletion_orphans["instance_no_form"].pk).exists())
            self.assertFalse(m.OrgUnit.objects.filter(pk=pre_deletion_orphans["org_unit_no_version"].pk).exists())

        if post_deletion_only_orphans is not None:
            assertion(APIImport.objects.filter(pk=post_deletion_only_orphans["api_import_no_app_id"].pk).exists())
            assertion(Config.objects.filter(pk=other_models["config"].pk).exists())
            assertion(m.DataSource.objects.filter(pk=post_deletion_only_orphans["data_source_no_project"].pk).exists())
            assertion(m.Device.objects.filter(pk=post_deletion_only_orphans["device_no_project"].pk).exists())
            assertion(m.ExportLog.objects.filter(pk=post_deletion_only_orphans["export_log_orphan"].pk).exists())
            assertion(
                m.ExportRequest.objects.filter(pk=post_deletion_only_orphans["export_request_orphan"].pk).exists()
            )
            assertion(
                m.Form.objects_include_deleted.filter(pk=post_deletion_only_orphans["form_no_project"].pk).exists()
            )
            assertion(
                m.Form.objects_include_deleted.filter(pk=post_deletion_only_orphans["form_no_form_id"].pk).exists()
            )
            assertion(Modification.objects.filter(pk=post_deletion_only_orphans["modification_orphan"].pk).exists())
            assertion(m.OpenHEXAInstance.objects.filter(pk=other_models["openhexa_instance"].pk).exists())
            assertion(m.Project.objects.filter(pk=post_deletion_only_orphans["project_no_account"].pk).exists())
            assertion(Session.objects.filter(pk=post_deletion_only_orphans["session"].pk).exists())

    def _assert_account_and_related_data_intact(
        self,
        account,
        data_source,
        source_version,
        project,
        other_models,
        mode=None,
        pre_deletion_orphans=None,
        post_deletion_only_orphans=None,
    ):
        self.assertTrue(m.Account.objects.filter(pk=account.pk).exists())
        self.assertTrue(m.AccountFeatureFlag.objects.filter(pk=other_models["account_feature_flag"].pk).exists())
        self.assertTrue(m.AlgorithmRun.objects.filter(pk=other_models["algorithm_run"].pk).exists())
        self.assertTrue(APIImport.objects.filter(pk=other_models["api_import"].pk).exists())
        self.assertTrue(Assignment.objects.filter(pk=other_models["assignment"].pk).exists())
        self.assertTrue(m.BulkCreateUserFile.objects.filter(pk=other_models["bulk_create_user_file"].pk).exists())
        self.assertTrue(m.CommentIaso.objects.filter(pk=other_models["comment_iaso"].pk).exists())
        self.assertTrue(m.DataSource.objects.filter(pk=data_source.pk).exists())
        self.assertTrue(
            m.DataSourceVersionsSynchronization.objects.filter(
                pk=other_models["data_source_versions_synchronization"].pk
            ).exists()
        )
        self.assertTrue(m.Device.objects.filter(pk=other_models["device"].pk).exists())
        self.assertTrue(m.DeviceOwnership.objects.filter(pk=other_models["device_ownership"].pk).exists())
        self.assertTrue(m.DevicePosition.objects.filter(pk=other_models["device_position"].pk).exists())
        self.assertTrue(m.Entity.objects_include_deleted.filter(pk=other_models["entity"].pk).exists())
        self.assertTrue(m.Entity.objects_include_deleted.filter(pk=other_models["entity_2"].pk).exists())
        self.assertTrue(m.EntityDuplicate.objects.filter(pk=other_models["entity_duplicate"].pk).exists())
        self.assertTrue(
            m.EntityDuplicateAnalyzis.objects.filter(pk=other_models["entity_duplicate_analyzis"].pk).exists()
        )
        self.assertTrue(m.EntityType.objects.filter(pk=other_models["entity_type"].pk).exists())
        self.assertTrue(m.ExportLog.objects.filter(pk=other_models["export_log"].pk).exists())
        self.assertTrue(m.ExportRequest.objects.filter(pk=other_models["export_request"].pk).exists())
        self.assertTrue(m.ExportStatus.objects.filter(pk=other_models["export_status"].pk).exists())
        self.assertTrue(m.ExternalCredentials.objects.filter(pk=other_models["credentials"].pk).exists())
        self.assertTrue(m.FeatureFlag.objects.filter(pk=other_models["feature_flag"].pk).exists())
        self.assertTrue(m.Form.objects_include_deleted.filter(pk=other_models["form"].pk).exists())
        self.assertTrue(m.FormAttachment.objects.filter(pk=other_models["form_attachment"].pk).exists())
        self.assertTrue(m.FormPredefinedFilter.objects.filter(pk=other_models["form_predefined_filter"].pk).exists())
        self.assertTrue(m.FormVersion.objects.filter(pk=other_models["form_version"].pk).exists())
        self.assertTrue(m.Group.objects.filter(pk=other_models["group"].pk).exists())
        self.assertTrue(m.GroupSet.objects.filter(pk=other_models["group_set"].pk).exists())
        self.assertTrue(m.ImportGPKG.objects.filter(pk=other_models["import_gpkg"].pk).exists())
        self.assertEqual(
            m.Instance.objects.filter(pk__in=[i.pk for i in other_models["instances"]]).count(),
            len(other_models["instances"]),
        )
        self.assertTrue(m.InstanceFile.objects.filter(pk=other_models["instance_file"].pk).exists())
        self.assertTrue(m.InstanceLock.objects.filter(pk=other_models["instance_lock"].pk).exists())
        self.assertTrue(JsonDataStore.objects.filter(pk=other_models["json_data_store"].pk).exists())
        self.assertTrue(m.Link.objects.filter(pk=other_models["link"].pk).exists())
        self.assertTrue(m.Mapping.objects.filter(pk=other_models["mapping"].pk).exists())
        self.assertTrue(m.MappingVersion.objects.filter(pk=other_models["mapping_version"].pk).exists())
        self.assertTrue(m.MatchingAlgorithm.objects.filter(pk=other_models["matching_algorithm"].pk).exists())
        self.assertTrue(m.MetricType.objects.filter(pk=other_models["metric_type"].pk).exists())
        self.assertTrue(m.MetricValue.objects.filter(pk=other_models["metric_value"].pk).exists())
        self.assertTrue(Modification.objects.filter(pk=other_models["modification"].pk).exists())
        self.assertTrue(m.OpenHEXAInstance.objects.filter(pk=other_models["openhexa_instance"].pk).exists())
        self.assertTrue(m.OpenHEXAWorkspace.objects.filter(pk=other_models["openhexa_workspace"].pk).exists())
        self.assertTrue(m.OrgUnit.objects.filter(pk=other_models["org_unit_parent"].pk).exists())
        self.assertTrue(m.OrgUnit.objects.filter(pk=other_models["org_unit_child"].pk).exists())
        self.assertTrue(m.OrgUnitChangeRequest.objects.filter(pk=other_models["org_unit_change_request"].pk).exists())
        self.assertTrue(
            m.OrgUnitChangeRequestConfiguration.objects.filter(
                pk=other_models["org_unit_change_request_configuration"].pk
            ).exists()
        )
        self.assertTrue(
            m.OrgUnitReferenceInstance.objects.filter(pk=other_models["org_unit_reference_instance"].pk).exists()
        )
        self.assertTrue(m.OrgUnitType.objects.filter(pk=other_models["org_unit_type"].pk).exists())
        self.assertTrue(m.Page.objects.filter(pk=other_models["page"].pk).exists())
        self.assertTrue(m.Payment.objects.filter(pk=other_models["payment"].pk).exists())
        self.assertTrue(m.PaymentLot.objects.filter(pk=other_models["payment_lot"].pk).exists())
        self.assertTrue(m.Planning.objects.filter(pk=other_models["planning"].pk).exists())
        self.assertTrue(PlanningSamplingResult.objects.filter(pk=other_models["sampling_result"].pk).exists())
        self.assertTrue(m.PotentialPayment.objects.filter(pk=other_models["potential_payment"].pk).exists())
        self.assertTrue(m.Profile.objects.filter(pk=other_models["profile"].pk).exists())
        self.assertTrue(m.Project.objects.filter(pk=project.pk).exists())
        self.assertTrue(m.ProjectFeatureFlags.objects.filter(pk=other_models["project_feature_flags"].pk).exists())
        self.assertTrue(m.Record.objects.filter(pk=other_models["record"].pk).exists())
        self.assertTrue(m.RecordType.objects.filter(pk=other_models["record_type"].pk).exists())
        self.assertTrue(m.Report.objects.filter(pk=other_models["report"].pk).exists())
        self.assertTrue(m.ReportVersion.objects.filter(pk=other_models["report_version"].pk).exists())
        self.assertTrue(m.SourceVersion.objects.filter(pk=source_version.pk).exists())
        self.assertTrue(m.StockItem.objects.filter(pk=other_models["stock_item"].pk).exists())
        self.assertTrue(m.StockItemRule.objects.filter(pk=other_models["stock_item_rule"].pk).exists())
        self.assertTrue(m.StockKeepingUnit.objects.filter(pk=other_models["stock_keeping_unit"].pk).exists())
        self.assertTrue(
            m.StockKeepingUnitChildren.objects.filter(pk=other_models["stock_keeping_unit_children"].pk).exists()
        )
        self.assertTrue(m.StockLedgerItem.objects.filter(pk=other_models["stock_ledger_item"].pk).exists())
        self.assertTrue(m.StockRulesVersion.objects.filter(pk=other_models["stock_rules_version"].pk).exists())
        self.assertTrue(m.StorageDevice.objects.filter(pk=other_models["storage_device"].pk).exists())
        self.assertTrue(m.StorageLogEntry.objects.filter(pk=other_models["storage_log_entry"].pk).exists())
        self.assertTrue(m.StoragePassword.objects.filter(pk=other_models["storage_password"].pk).exists())
        self.assertTrue(m.Task.objects.filter(pk=other_models["task"].pk).exists())
        self.assertTrue(m.TaskLog.objects.filter(pk=other_models["task_log"].pk).exists())
        self.assertEqual(
            m.Team.objects.filter(
                pk__in=[
                    other_models["team"].pk,
                    other_models["team_parent"].pk,
                    other_models["team_grandparent"].pk,
                ]
            ).count(),
            3,
        )
        self.assertTrue(m.TemporaryForm.objects.filter(pk=other_models["temporary_form"].pk).exists())
        self.assertTrue(m.TenantUser.objects.filter(pk=other_models["tenant_user"].pk).exists())
        self.assertTrue(m.User.objects.filter(pk=other_models["user"].pk).exists())
        self.assertTrue(m.UserRole.objects.filter(pk=other_models["user_role"].pk).exists())
        self.assertTrue(m.ValidationNode.objects.filter(pk=other_models["validation_node"].pk).exists())
        self.assertTrue(
            m.ValidationNodeTemplate.objects.filter(pk=other_models["validation_node_template"].pk).exists()
        )
        self.assertTrue(m.ValidationWorkflow.objects.filter(pk=other_models["validation_workflow"].pk).exists())
        self.assertTrue(m.Workflow.objects.filter(pk=other_models["workflow"].pk).exists())
        self.assertTrue(m.WorkflowChange.objects.filter(pk=other_models["workflow_change"].pk).exists())
        self.assertTrue(m.WorkflowFollowup.objects.filter(pk=other_models["workflow_followup"].pk).exists())
        self.assertTrue(m.WorkflowVersion.objects.filter(pk=other_models["workflow_version"].pk).exists())

        # some models have no FK to Account at all — `_post_deletion_clean_up`
        # wipes them in full whenever it runs, regardless of which account "owns" them in this
        # test's fixtures. It only runs for real (non-dry-run) --account-to-keep mode.
        post_deletion_cleanup_ran = mode == MODE_KEEP_SINGLE_ACCOUNT
        assertion = self.assertFalse if post_deletion_cleanup_ran else self.assertTrue
        assertion(Config.objects.filter(pk=other_models["config"].pk).exists())

        if post_deletion_cleanup_ran:
            self.assertFalse(SqlDashboard.objects.filter(pk=other_models["sql_dashboard"].pk).exists())
        else:
            self.assertTrue(
                SqlDashboard.objects.filter(pk=other_models["sql_dashboard"].pk, owned_by=other_models["user"]).exists()
            )

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
        extra_models_to_keep = self._populate_account(
            self.account_to_keep, self.version_to_keep, self.project_to_keep, suffix="kept"
        )
        extra_models_to_delete = self._populate_account(
            self.account_to_delete, self.version_to_delete, self.project_to_delete, suffix="deleted"
        )

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
            extra_models_to_delete,
            pre_deletion_orphans=pre_deletion_orphans,
            post_deletion_only_orphans=post_deletion_only_orphans,
        )
        self._assert_account_and_related_data_intact(
            self.account_to_keep,
            self.data_source_to_keep,
            self.version_to_keep,
            self.project_to_keep,
            extra_models_to_keep,
        )

    def test_dry_run_keep_single_account_mode_does_not_delete_anything(self):
        pre_deletion_orphans, post_deletion_only_orphans = self._create_unscoped_data()
        extra_models_to_keep = self._populate_account(
            self.account_to_keep, self.version_to_keep, self.project_to_keep, suffix="kept"
        )
        extra_models_to_delete = self._populate_account(
            self.account_to_delete, self.version_to_delete, self.project_to_delete, suffix="deleted"
        )

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
            extra_models_to_delete,
            pre_deletion_orphans=pre_deletion_orphans,
            post_deletion_only_orphans=post_deletion_only_orphans,
        )
        self._assert_account_and_related_data_intact(
            self.account_to_keep,
            self.data_source_to_keep,
            self.version_to_keep,
            self.project_to_keep,
            extra_models_to_keep,
        )

    def test_delete_specific_account(self):
        pre_deletion_orphans, post_deletion_only_orphans = self._create_unscoped_data()
        extra_models_to_keep = self._populate_account(
            self.account_to_keep, self.version_to_keep, self.project_to_keep, suffix="kept"
        )
        extra_models_to_delete = self._populate_account(
            self.account_to_delete, self.version_to_delete, self.project_to_delete, suffix="deleted"
        )

        # chunk_size=2 forces _delete_qs_in_chunks to loop across multiple chunks
        # (5 Instance rows per account) instead of clearing everything in one pass.
        management.call_command(
            "delete_accounts", accounts_to_delete=[self.account_to_delete.pk], chunk_size=2, verbosity=0
        )

        self._assert_account_and_related_data_gone(
            self.account_to_delete,
            self.data_source_to_delete,
            self.version_to_delete,
            self.project_to_delete,
            extra_models_to_delete,
            mode=MODE_DELETE_ACCOUNTS,
            pre_deletion_orphans=pre_deletion_orphans,
            post_deletion_only_orphans=post_deletion_only_orphans,
        )
        self._assert_account_and_related_data_intact(
            self.account_to_keep,
            self.data_source_to_keep,
            self.version_to_keep,
            self.project_to_keep,
            extra_models_to_keep,
        )

    def test_delete_multiple_specific_accounts(self):
        pre_deletion_orphans, post_deletion_only_orphans = self._create_unscoped_data()
        extra_models_to_keep = self._populate_account(
            self.account_to_keep, self.version_to_keep, self.project_to_keep, suffix="kept"
        )
        extra_models_to_delete = self._populate_account(
            self.account_to_delete, self.version_to_delete, self.project_to_delete, suffix="deleted"
        )

        account_to_delete_2, data_source_to_delete_2, version_to_delete_2, project_to_delete_2 = (
            self.create_account_datasource_version_project("source deleted 2", "account deleted 2", "project deleted 2")
        )
        extra_models_to_delete_2 = self._populate_account(
            account_to_delete_2, version_to_delete_2, project_to_delete_2, suffix="deleted2"
        )

        # call_command's list-kwarg support for action="append" only works for a single
        # value — passing multiple repeats the flag as separate argv-style args instead.
        management.call_command(
            "delete_accounts",
            "--account-to-delete",
            str(self.account_to_delete.pk),
            "--account-to-delete",
            str(account_to_delete_2.pk),
            verbosity=0,
        )

        self._assert_account_and_related_data_gone(
            self.account_to_delete,
            self.data_source_to_delete,
            self.version_to_delete,
            self.project_to_delete,
            extra_models_to_delete,
            mode=MODE_DELETE_ACCOUNTS,
            pre_deletion_orphans=pre_deletion_orphans,
            post_deletion_only_orphans=post_deletion_only_orphans,
        )
        self._assert_account_and_related_data_gone(
            account_to_delete_2,
            data_source_to_delete_2,
            version_to_delete_2,
            project_to_delete_2,
            extra_models_to_delete_2,
            mode=MODE_DELETE_ACCOUNTS,
        )
        self._assert_account_and_related_data_intact(
            self.account_to_keep,
            self.data_source_to_keep,
            self.version_to_keep,
            self.project_to_keep,
            extra_models_to_keep,
        )

    def test_keep_single_account(self):
        pre_deletion_orphans, post_deletion_only_orphans = self._create_unscoped_data()
        extra_models_to_keep = self._populate_account(
            self.account_to_keep, self.version_to_keep, self.project_to_keep, suffix="kept"
        )
        extra_models_to_delete = self._populate_account(
            self.account_to_delete, self.version_to_delete, self.project_to_delete, suffix="deleted"
        )

        management.call_command("delete_accounts", account_to_keep=self.account_to_keep.pk, verbosity=0)

        self._assert_account_and_related_data_gone(
            self.account_to_delete,
            self.data_source_to_delete,
            self.version_to_delete,
            self.project_to_delete,
            extra_models_to_delete,
            mode=MODE_KEEP_SINGLE_ACCOUNT,
            pre_deletion_orphans=pre_deletion_orphans,
            post_deletion_only_orphans=post_deletion_only_orphans,
        )
        self._assert_account_and_related_data_intact(
            self.account_to_keep,
            self.data_source_to_keep,
            self.version_to_keep,
            self.project_to_keep,
            extra_models_to_keep,
            mode=MODE_KEEP_SINGLE_ACCOUNT,
        )

    def test_keep_single_account_prints_stats_and_remaining_credentials(self):
        """
        `handle()` used to `return` straight out of each mode branch, making the trailing
        `_log("Done!")` / `_print_model_stats()` unreachable dead code for every mode —
        the "Row counts after deletion" / "Remaining accounts" / "Remaining credentials"
        summary never actually printed. Verifies it's reachable again.
        """
        self._populate_account(self.account_to_keep, self.version_to_keep, self.project_to_keep, suffix="kept")
        self._populate_account(self.account_to_delete, self.version_to_delete, self.project_to_delete, suffix="deleted")

        out = StringIO()
        management.call_command(
            "delete_accounts",
            account_to_keep=self.account_to_keep.pk,
            verbosity=1,
            stdout=out,
        )
        output = out.getvalue()

        self.assertIn("Done!", output)
        self.assertIn("Row counts after deletion:", output)
        self.assertIn(f"{m.Team._meta.label:<55s}", output)  # a row-count line for a real model

        # `account_to_delete`'s name legitimately appears earlier in the log (it's being
        # deleted) — scope these checks to the final "Remaining ..." sections specifically.
        self.assertIn("Remaining accounts:", output)
        remaining_accounts_section = output.split("Remaining accounts:", 1)[1].split("Remaining credentials:", 1)[0]
        self.assertIn(self.account_to_keep.name, remaining_accounts_section)
        self.assertNotIn(self.account_to_delete.name, remaining_accounts_section)

        self.assertIn("Remaining credentials:", output)
        remaining_credentials_section = output.split("Remaining credentials:", 1)[1]
        self.assertIn("cred_kept", remaining_credentials_section)  # kept account's credentials survive
        self.assertNotIn("cred_deleted", remaining_credentials_section)  # deleted account's are gone


class DeleteAccountsModelCoverageTestCase(TestCase):
    """
    Drift guard: fails as soon as a model is added to (or removed from) the `iaso` app,
    so it can't silently go unhandled by delete_accounts.py / uncovered by
    DeleteAccountsCommandTestCase above.

    Uses the exact same "project model" filter (`_is_project_model`) the command itself
    uses to decide which models the FK-graph BFS may auto-discover — see that function's
    docstring in delete_accounts.py.

    Limitation: plugin apps (polio, wfp, registry, wfp_auth) are NOT loaded in this test
    environment ("Enabled plugins: []" — no `PLUGINS` env var set here), so
    `apps.get_models()` never returns their models and this snapshot can't cover them.
    Only `iaso` app models are checked.
    """

    # Snapshot of every managed `iaso`-app model as of the last time DeleteAccountsCommandTestCase's
    # fixtures (_populate_account + both assertion helpers) were updated. When this test fails:
    #   1. Read delete_accounts.py's module docstring ("What is automatic" / "What's out of graph")
    #      to see whether the new model needs dedicated out-of-graph handling.
    #   2. Add it to _populate_account and to both _assert_account_and_related_data_*  helpers.
    #   3. Update KNOWN_IASO_MODELS below to match.
    KNOWN_IASO_MODELS = frozenset(
        {
            "iaso.Account",
            "iaso.AccountFeatureFlag",
            "iaso.AlgorithmRun",
            "iaso.Assignment",
            "iaso.BulkCreateUserFile",
            "iaso.CommentIaso",
            "iaso.Config",
            "iaso.DataSource",
            "iaso.DataSourceVersionsSynchronization",
            "iaso.Device",
            "iaso.DeviceOwnership",
            "iaso.DevicePosition",
            "iaso.Entity",
            "iaso.EntityDuplicate",
            "iaso.EntityDuplicateAnalyzis",
            "iaso.EntityType",
            "iaso.ExportLog",
            "iaso.ExportRequest",
            "iaso.ExportStatus",
            "iaso.ExternalCredentials",
            "iaso.FeatureFlag",
            "iaso.Form",
            "iaso.FormAttachment",
            "iaso.FormPredefinedFilter",
            "iaso.FormVersion",
            "iaso.Group",
            "iaso.GroupSet",
            "iaso.ImportGPKG",
            "iaso.Instance",
            "iaso.InstanceFile",
            "iaso.InstanceLock",
            "iaso.JsonDataStore",
            "iaso.Link",
            "iaso.Mapping",
            "iaso.MappingVersion",
            "iaso.MatchingAlgorithm",
            "iaso.MetricType",
            "iaso.MetricValue",
            "iaso.OpenHEXAInstance",
            "iaso.OpenHEXAWorkspace",
            "iaso.OrgUnit",
            "iaso.OrgUnitChangeRequest",
            "iaso.OrgUnitChangeRequestConfiguration",
            "iaso.OrgUnitReferenceInstance",
            "iaso.OrgUnitType",
            "iaso.Page",
            "iaso.Payment",
            "iaso.PaymentLot",
            "iaso.Planning",
            "iaso.PlanningSamplingResult",
            "iaso.PotentialPayment",
            "iaso.Profile",
            "iaso.Project",
            "iaso.ProjectFeatureFlags",
            "iaso.Record",
            "iaso.RecordType",
            "iaso.Report",
            "iaso.ReportVersion",
            "iaso.SourceVersion",
            "iaso.StockItem",
            "iaso.StockItemRule",
            "iaso.StockKeepingUnit",
            "iaso.StockKeepingUnitChildren",
            "iaso.StockLedgerItem",
            "iaso.StockRulesVersion",
            "iaso.StorageDevice",
            "iaso.StorageLogEntry",
            "iaso.StoragePassword",
            "iaso.Task",
            "iaso.TaskLog",
            "iaso.Team",
            "iaso.TemporaryForm",
            "iaso.TenantUser",
            "iaso.UserRole",
            "iaso.ValidationNode",
            "iaso.ValidationNodeTemplate",
            "iaso.ValidationWorkflow",
            "iaso.Workflow",
            "iaso.WorkflowChange",
            "iaso.WorkflowFollowup",
            "iaso.WorkflowVersion",
        }
    )

    def test_iaso_models_match_known_snapshot(self):
        from django.apps import apps

        from iaso.management.commands.delete_accounts import _is_project_model

        current_models = {
            model._meta.label
            for model in apps.get_models()
            if model._meta.managed
            and _is_project_model(model)
            and model._meta.app_label == "iaso"
            # Dummy models declared inline in test modules (e.g. to exercise a custom field or
            # serializer) get registered under the "iaso" app label too, but they're test
            # scaffolding only — never present outside of running that test, irrelevant to
            # delete_accounts.py's scope. Exclude anything defined under iaso/tests/.
            and not model.__module__.startswith("iaso.tests.")
        }

        new_models = current_models - self.KNOWN_IASO_MODELS
        self.assertFalse(
            new_models,
            f"New iaso model(s) found: {sorted(new_models)}. Before adding to KNOWN_IASO_MODELS: "
            "check whether delete_accounts.py needs dedicated out-of-graph handling for them "
            "(see its module docstring), then add fixtures/assertions to "
            "DeleteAccountsCommandTestCase covering them.",
        )

        removed_models = self.KNOWN_IASO_MODELS - current_models
        self.assertFalse(
            removed_models,
            f"iaso model(s) removed since this snapshot was taken: {sorted(removed_models)}. "
            "Remove them from KNOWN_IASO_MODELS here, and from DeleteAccountsCommandTestCase's "
            "fixtures/assertions if still referenced there.",
        )
