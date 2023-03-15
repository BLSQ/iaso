from beanstalk_worker.services import TestTaskService
from iaso.test import APITestCase
from ...models import OrgUnit, OrgUnitType, Account, Project, SourceVersion, DataSource, Task


class IasoTasksTestCase(APITestCase):
    @classmethod
    def setUp(cls):
        source = DataSource.objects.create(name="Valley Championship")
        old_version = SourceVersion.objects.create(number=1, data_source=source)
        cls.new_version = SourceVersion.objects.create(number=2, data_source=source)

        account = Account(name="Cobra Kai", default_version=cls.new_version)
        account.save()

        cls.project = Project(name="The Show", app_id="com.cobrakai.show", account=account)
        cls.project.save()

        org_unit_type = OrgUnitType(name="Dojo", short_name="dojo")
        org_unit_type.save()
        cls.project.unit_types.add(org_unit_type)
        source.projects.add(cls.project)
        OrgUnit.objects.create(version=old_version, name="Myagi", org_unit_type=org_unit_type, source_ref="nomercy")
        cls.source = source
        cls.johnny = cls.create_user_with_profile(
            username="johnny", account=account, permissions=["iaso_sources", "iaso_data_tasks"]
        )
        cls.miguel = cls.create_user_with_profile(username="miguel", account=account, permissions=[])

    def test_tasks_user_without_permissions_access(self):
        self.client.force_authenticate(self.miguel)
        response = self.client.get("/api/tasks/")
        self.assertEqual(response.status_code, 403)

    def test_tasks_user_can_access(self):
        """
        Both permissions iaso_sources and iaso_data_tasks are required to access tasks.
        """
        self.client.force_authenticate(self.johnny)

        task = Task.objects.create(
            progress_value=1,
            end_value=1,
            account=self.johnny.iaso_profile.account,
            launcher=self.johnny,
            status="Success",
            name="The best task",
        )

        response = self.client.get("/api/tasks/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["tasks"][0]["name"], "The best task")
        self.assertEqual(response.json()["tasks"][0]["status"], "Success")
        self.assertEqual(response.json()["tasks"][0]["id"], task.id)
        self.assertEqual(response.json()["tasks"][0]["end_value"], 1)
        self.assertEqual(response.json()["tasks"][0]["launcher"]["username"], "johnny")
