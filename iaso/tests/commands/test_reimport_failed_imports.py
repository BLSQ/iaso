import uuid

from io import StringIO

from django.core import management
from django.core.management.base import CommandError

from hat.api_import.models import APIImport
from iaso import models as m
from iaso.test import TestCase


APP_ID = "be.health.app"


class ReimportFailedImportsTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Belgium")
        cls.project = m.Project.objects.create(name="Belgium health", app_id=APP_ID, account=cls.account)
        source = m.DataSource.objects.create(name="Belgium pyramid")
        source.projects.add(cls.project)
        cls.version = m.SourceVersion.objects.create(data_source=source, number=1)
        cls.account.default_version = cls.version
        cls.account.save()
        cls.user = cls.create_user_with_profile(username="belgium", account=cls.account)
        cls.org_unit_type = m.OrgUnitType.objects.create(name="Hospital")
        cls.org_unit = m.OrgUnit.objects.create(name="Brussels", version=cls.version)
        cls.form = m.Form.objects.create(name="Visit")
        cls.form.projects.add(cls.project)

    def failed_instance_import(self, app_id=APP_ID) -> tuple[APIImport, str]:
        instance_uuid = str(uuid.uuid4())
        api_import = APIImport.objects.create(
            user=self.user,
            import_type="instance",
            app_id=app_id,
            has_problem=True,
            exception="ProgrammingError: column iaso_instance.mission_id does not exist",
            json_body=[
                {
                    "id": instance_uuid,
                    "file": f"/storage/emulated/0/odk/instances/{instance_uuid}.xml",
                    "name": "Visit",
                    "orgUnitId": str(self.org_unit.id),
                    "formId": str(self.form.id),
                    "created_at": 1792858718.594,
                }
            ],
        )
        return api_import, instance_uuid

    def failed_org_units_import(self) -> tuple[APIImport, str, str]:
        parent_uuid, child_uuid = str(uuid.uuid4()), str(uuid.uuid4())
        org_unit = {"orgUnitTypeId": self.org_unit_type.id, "latitude": 50.85, "longitude": 4.35}
        api_import = APIImport.objects.create(
            user=self.user,
            import_type="orgUnit",
            app_id=APP_ID,
            has_problem=True,
            # The child comes first: it can only be imported once its parent is
            json_body=[
                {**org_unit, "id": child_uuid, "name": "Ixelles", "parentId": parent_uuid, "created_at": 1792858719},
                {**org_unit, "id": parent_uuid, "name": "Brussels", "created_at": 1792858718},
            ],
        )
        return api_import, parent_uuid, child_uuid

    def failed_bulk_import(self, app_id=APP_ID) -> APIImport:
        return APIImport.objects.create(
            user=self.user, import_type="bulk", app_id=app_id, has_problem=True, json_body={"user_agent": "Iaso"}
        )

    def reimport(self, *args) -> tuple[str, str]:
        stdout, stderr = StringIO(), StringIO()
        management.call_command("reimport_failed_imports", *args, stdout=stdout, stderr=stderr)
        return stdout.getvalue(), stderr.getvalue()

    def assertHasProblem(self, api_import: APIImport, has_problem: bool):
        api_import.refresh_from_db()
        self.assertEqual(api_import.has_problem, has_problem, f"APIImport {api_import.id}.has_problem")

    def test_requires_ids_or_all(self):
        api_import, instance_uuid = self.failed_instance_import()

        with self.assertRaisesMessage(CommandError, "Give the APIImport ids to replay (--ids), or --all"):
            self.reimport()

        self.assertFalse(m.Instance.objects.filter(uuid=instance_uuid).exists())
        self.assertHasProblem(api_import, True)

    def test_replays_only_the_given_ids(self):
        replayed, replayed_uuid = self.failed_instance_import()
        not_replayed, not_replayed_uuid = self.failed_instance_import()

        stdout, stderr = self.reimport("--ids", str(replayed.id))

        instance = m.Instance.objects.get(uuid=replayed_uuid)
        self.assertEqual(instance.project, self.project)
        self.assertEqual(instance.org_unit, self.org_unit)
        self.assertEqual(instance.form, self.form)
        self.assertEqual(instance.api_import, replayed)
        self.assertHasProblem(replayed, False)
        self.assertFalse(m.Instance.objects.filter(uuid=not_replayed_uuid).exists())
        self.assertHasProblem(not_replayed, True)
        self.assertEqual(stdout, "Replayed: 1, failed: 0, launched: 0\n")
        self.assertEqual(stderr, "")

    def test_all_replays_org_units_parents_first_and_instances(self):
        org_units_import, parent_uuid, child_uuid = self.failed_org_units_import()
        instance_import, instance_uuid = self.failed_instance_import()

        stdout, _ = self.reimport("--all")

        parent = m.OrgUnit.objects.get(uuid=parent_uuid)
        child = m.OrgUnit.objects.get(uuid=child_uuid)
        self.assertEqual(child.parent, parent)
        self.assertEqual(parent.version, self.version)
        self.assertEqual(parent.creator, self.user)
        self.assertHasProblem(org_units_import, False)
        self.assertTrue(m.Instance.objects.filter(uuid=instance_uuid).exists())
        self.assertHasProblem(instance_import, False)
        self.assertEqual(stdout, "Replayed: 2, failed: 0, launched: 0\n")

    def test_a_failing_import_is_rolled_back_and_does_not_stop_the_others(self):
        failing, failing_uuid = self.failed_instance_import(app_id="fr.unknown.app")
        replayed, replayed_uuid = self.failed_instance_import()

        stdout, stderr = self.reimport("--ids", str(failing.id), str(replayed.id))

        self.assertFalse(m.Instance.objects.filter(uuid=failing_uuid).exists())
        self.assertHasProblem(failing, True)
        self.assertIn(f"APIImport {failing.id} (instance) failed: DoesNotExist(", stderr)
        self.assertTrue(m.Instance.objects.filter(uuid=replayed_uuid).exists())
        self.assertHasProblem(replayed, False)
        self.assertEqual(stdout, "Replayed: 1, failed: 1, launched: 0\n")

    def test_dry_run_rolls_back(self):
        org_units_import, parent_uuid, _ = self.failed_org_units_import()
        instance_import, instance_uuid = self.failed_instance_import()
        bulk_import = self.failed_bulk_import()

        stdout, stderr = self.reimport("--all", "--dry-run")

        self.assertFalse(m.OrgUnit.objects.filter(uuid=parent_uuid).exists())
        self.assertFalse(m.Instance.objects.filter(uuid=instance_uuid).exists())
        self.assertHasProblem(org_units_import, True)
        self.assertHasProblem(instance_import, True)
        self.assertHasProblem(bulk_import, True)
        self.assertEqual(stdout, "Replayed: 2, failed: 0 (dry run, rolled back), to launch: 1\n")
        self.assertFalse(m.Task.objects.exists())
        self.assertEqual(stderr, "")

    def test_skips_fixed_and_other_import_types(self):
        fixed, fixed_uuid = self.failed_instance_import()
        fixed.has_problem = False
        fixed.save()
        storage_log = APIImport.objects.create(
            user=self.user, import_type="storageLog", app_id=APP_ID, has_problem=True, json_body=[]
        )

        stdout, _ = self.reimport("--ids", str(fixed.id), str(storage_log.id))

        self.assertFalse(m.Instance.objects.filter(uuid=fixed_uuid).exists())
        self.assertHasProblem(storage_log, True)
        self.assertEqual(stdout, "Replayed: 0, failed: 0, launched: 0\n")

    def test_bulk_upload_task_launched_again(self):
        bulk_import = self.failed_bulk_import()
        unknown_app_bulk_import = self.failed_bulk_import(app_id="fr.unknown.app")

        stdout, stderr = self.reimport("--ids", str(bulk_import.id), str(unknown_app_bulk_import.id))

        task = m.Task.objects.get()
        self.assertEqual(task.name, "process_mobile_bulk_upload")
        self.assertEqual(task.launcher, self.user)
        self.assertEqual(task.params["kwargs"], {"api_import_id": bulk_import.id, "project_id": self.project.id})
        # Reset by the task, once it succeeds
        self.assertHasProblem(bulk_import, True)
        self.assertIn(f"APIImport {unknown_app_bulk_import.id} (bulk) failed: DoesNotExist(", stderr)
        self.assertEqual(stdout, "Replayed: 0, failed: 1, launched: 1\n")

    def test_skips_imports_without_user(self):
        # The project doesn't need authentication: the anonymous import could be replayed, but isn't
        anonymous_import, anonymous_uuid = self.failed_instance_import()
        anonymous_import.user = None
        anonymous_import.save()
        replayed, replayed_uuid = self.failed_instance_import()

        stdout, stderr = self.reimport("--all")

        self.assertFalse(m.Instance.objects.filter(uuid=anonymous_uuid).exists())
        self.assertHasProblem(anonymous_import, True)
        self.assertTrue(m.Instance.objects.filter(uuid=replayed_uuid).exists())
        self.assertEqual(stderr, f"Skipped 1 imports without user: [{anonymous_import.id}]\n")
        self.assertEqual(stdout, "Replayed: 1, failed: 0, launched: 0\n")

    def test_verbosity_lists_the_replayed_imports(self):
        api_import, _ = self.failed_instance_import()

        stdout, _ = self.reimport("--ids", str(api_import.id), "--verbosity", "2")

        self.assertEqual(
            stdout, f"APIImport {api_import.id} (instance) replayed\nReplayed: 1, failed: 0, launched: 0\n"
        )
