from beanstalk_worker.services import TestTaskService
from iaso.test import APITestCase
from ...models import OrgUnit, OrgUnitType, Account, Project, SourceVersion, DataSource, Task


class CopyVersionTestCase(APITestCase):
    @classmethod
    def setUp(cls):
        source = DataSource.objects.create(name="Valley Championship")
        old_version = SourceVersion.objects.create(number=1, data_source=source)
        cls.new_version = SourceVersion.objects.create(number=2, data_source=source)

        account = Account(name="Cobra Kai", default_version=cls.new_version)
        account.save()

        cls.project = Project(name="The Show", app_id="com.cobrakai.show", account=account)
        cls.project.save()

        unit_type = OrgUnitType(name="Dojo", short_name="dojo")
        unit_type.save()
        cls.project.unit_types.add(unit_type)
        source.projects.add(cls.project)
        OrgUnit.objects.create(version=old_version, name="Myagi", org_unit_type=unit_type, source_ref="nomercy")
        cls.source = source
        cls.johnny = cls.create_user_with_profile(
            username="johnny", account=account, permissions=["iaso_sources", "iaso_data_tasks"]
        )
        cls.miguel = cls.create_user_with_profile(username="miguel", account=account, permissions=[])
        cls.user_with_data_sources_perms = cls.create_user_with_profile(
            username="user_with_data_sources_perms", account=account, permissions=["iaso_sources"]
        )
        cls.user_with_data_tasks_perms = cls.create_user_with_profile(
            username="user_with_data_tasks_perms", account=account, permissions=["iaso_data_tasks"]
        )

    def test_copy_version(self):
        """Copying a version through the api"""

        self.client.force_authenticate(self.johnny)

        data = {
            "source_source_id": self.source.id,
            "destination_source_id": self.source.id,
            "source_version_number": 1,
            "destination_version_number": 2,
        }

        response = self.client.post("/api/copyversion/", data=data, format="json")
        body = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertHasField(body, "task", object)
        task = body["task"]
        self.assertEqual(task["status"], "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        org_unit_copy = OrgUnit.objects.get(version=self.new_version, name="Myagi")
        self.assertEqual(org_unit_copy.source_ref, "nomercy")
        response = self.client.post("/api/copyversion/", data=data, format="json")

        self.assertEqual(response.status_code, 400)  # you can't overwrite a version without setting force=true

        data = {
            "source_source_id": self.source.id,
            "destination_source_id": self.source.id,
            "source_version_number": 1,
            "destination_version_number": 2,
            "force": True,
        }
        response = self.client.post("/api/copyversion/", data=data, format="json")

        self.assertEqual(response.status_code, 200)  # you can overwrite a version when setting force=true

        response = self.client.get("/api/tasks/%d/" % task["id"])

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "SUCCESS")

    def test_copy_version_unauthorized(self):
        self.client.force_authenticate(self.miguel)
        response = self.client.post("/api/copyversion/", data={}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_user_with_only_data_sources_permissions(self):
        # user needs  both data_sources and data_tasks permissions
        self.client.force_authenticate(self.user_with_data_sources_perms)
        response = self.client.post("/api/copyversion/", data={}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_user_with_only_data_tasks_permissions(self):
        # user needs  both data_sources and data_tasks permissions
        self.client.force_authenticate(self.user_with_data_sources_perms)
        response = self.client.post("/api/copyversion/", data={}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_self_copy(self):
        self.client.force_authenticate(self.johnny)

        data = {
            "source_source_id": self.source.id,
            "destination_source_id": self.source.id,
            "source_version_number": 1,
            "destination_version_number": 1,
        }

        response = self.client.post("/api/copyversion/", data=data, format="json")

        self.assertEqual(response.status_code, 400)  # it's a bad idea to copy a version on itself

    def test_copy_version_kill(self):
        """Copying a version through the api"""

        self.client.force_authenticate(self.johnny)

        data = {
            "source_source_id": self.source.id,
            "destination_source_id": self.source.id,
            "source_version_number": 1,
            "destination_version_number": 2,
        }

        response = self.client.post("/api/copyversion/", data=data, format="json")
        body = response.json()
        task = body["task"]

        self.assertEqual(task["status"], "QUEUED")

        task_model = Task.objects.get(id=task["id"])
        task_model.should_be_killed = True
        task_model.save()

        task_service = TestTaskService()

        task_service.run_all()

        response = self.client.get("/api/tasks/%d/" % task["id"])

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "KILLED")
