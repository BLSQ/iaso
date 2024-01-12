import datetime
import time_machine

from django.utils import timezone

from iaso import models as m
from iaso.api.tasks import TaskSerializer
from iaso.test import APITestCase, TestCase


DT = datetime.datetime(2023, 12, 20, 15, 0, 0, 0, tzinfo=timezone.utc)


@time_machine.travel(DT, tick=False)
class TaskSerializerSerializerTestCase(TestCase):
    """
    Test Task serializer.
    """

    @classmethod
    def setUpTestData(cls):
        data_source = m.DataSource.objects.create(name="Data source")
        version = m.SourceVersion.objects.create(number=1, data_source=data_source)
        account = m.Account.objects.create(name="Account", default_version=version)
        user = cls.create_user_with_profile(
            username="user", account=account, permissions=["iaso_sources", "iaso_data_tasks"]
        )

        cls.task = m.Task.objects.create(
            progress_value=1,
            end_value=1,
            account=user.iaso_profile.account,
            launcher=user,
            status="Success",
            name="org_unit_bulk_update",
            result="324.49 sec, processed 5262 org units",
            params={},
        )

        cls.task_polio = m.Task.objects.create(
            progress_value=1,
            end_value=1,
            account=user.iaso_profile.account,
            launcher=user,
            status="Success",
            name="create_polio_notifications_async",
            result="3768 polio notifications created.",
            params={
                "args": [],
                "kwargs": {"pk": 10},
                "method": "create_polio_notifications_async",
                "module": "plugins.polio.models",
            },
        )

    def test_serialize_instance_of_task(self):
        serializer = TaskSerializer(self.task)
        self.assertEqual(
            serializer.data,
            {
                "id": self.task.pk,
                "created_at": DT.timestamp(),
                "started_at": None,
                "ended_at": None,
                "progress_value": 1,
                "end_value": 1,
                "launcher": {
                    "first_name": "",
                    "last_name": "",
                    "username": "user",
                },
                "result": "324.49 sec, processed 5262 org units",
                "status": "Success",
                "name": "org_unit_bulk_update",
                "should_be_killed": False,
                "progress_message": None,
                "polio_notification_import_id": None,
            },
        )

    def test_serialize_instance_of_polio_notification_task(self):
        serializer = TaskSerializer(self.task_polio)
        self.assertEqual(
            serializer.data,
            {
                "id": self.task_polio.pk,
                "created_at": DT.timestamp(),
                "started_at": None,
                "ended_at": None,
                "progress_value": 1,
                "end_value": 1,
                "launcher": {
                    "first_name": "",
                    "last_name": "",
                    "username": "user",
                },
                "result": "3768 polio notifications created.",
                "status": "Success",
                "name": "create_polio_notifications_async",
                "should_be_killed": False,
                "progress_message": None,
                "polio_notification_import_id": 10,
            },
        )


class IasoTasksTestCase(APITestCase):
    @classmethod
    def setUp(cls):
        source = m.DataSource.objects.create(name="Valley Championship")
        old_version = m.SourceVersion.objects.create(number=1, data_source=source)
        cls.new_version = m.SourceVersion.objects.create(number=2, data_source=source)

        account = m.Account(name="Cobra Kai", default_version=cls.new_version)
        account.save()

        cls.project = m.Project(name="The Show", app_id="com.cobrakai.show", account=account)
        cls.project.save()

        org_unit_type = m.OrgUnitType(name="Dojo", short_name="dojo")
        org_unit_type.save()
        cls.project.unit_types.add(org_unit_type)
        source.projects.add(cls.project)
        m.OrgUnit.objects.create(version=old_version, name="Myagi", org_unit_type=org_unit_type, source_ref="nomercy")
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

        task = m.Task.objects.create(
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
