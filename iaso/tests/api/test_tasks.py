import datetime

import time_machine

from django.utils import timezone

from iaso import models as m
from iaso.api.tasks.serializers import TaskSerializer
from iaso.models.base import ERRORED, EXPORTED, QUEUED, RUNNING, SUCCESS
from iaso.permissions.core_permissions import CORE_DATA_TASKS_PERMISSION
from iaso.test import APITestCase, TestCase


CREATED_AT = datetime.datetime(2023, 12, 20, 15, 0, 0, 0, tzinfo=timezone.utc)


@time_machine.travel(CREATED_AT, tick=False)
class TaskSerializerSerializerTestCase(TestCase):
    """
    Test Task serializer.
    """

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        data_source = m.DataSource.objects.create(name="Data source")
        version = m.SourceVersion.objects.create(number=1, data_source=data_source)
        account = m.Account.objects.create(name="Account", default_version=version)
        cls.user = cls.create_user_with_profile(
            username="user", account=account, permissions=[CORE_DATA_TASKS_PERMISSION]
        )

        cls.task = m.Task.objects.create(
            progress_value=1,
            end_value=1,
            account=cls.user.iaso_profile.account,
            created_by=cls.user,
            status="Success",
            name="org_unit_bulk_update",
            result="324.49 sec, processed 5262 org units",
            params={},
        )

        cls.task_polio = m.Task.objects.create(
            progress_value=1,
            end_value=1,
            account=cls.user.iaso_profile.account,
            created_by=cls.user,
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
        self.assertDictEqual(
            serializer.data,
            {
                "id": self.task.pk,
                "created_at": CREATED_AT.timestamp(),
                "started_at": None,
                "ended_at": None,
                "progress_value": 1,
                "end_value": 1,
                "created_by": {
                    "first_name": "",
                    "full_name": "",
                    "id": self.user.pk,
                    "last_name": "",
                    "username": self.user.username,
                },
                "launcher": None,
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
        self.assertDictEqual(
            serializer.data,
            {
                "id": self.task_polio.pk,
                "created_at": CREATED_AT.timestamp(),
                "started_at": None,
                "ended_at": None,
                "progress_value": 1,
                "end_value": 1,
                "created_by": {
                    "first_name": "",
                    "full_name": "",
                    "id": self.user.pk,
                    "last_name": "",
                    "username": self.user.username,
                },
                "launcher": None,
                "result": "3768 polio notifications created.",
                "status": "Success",
                "name": "create_polio_notifications_async",
                "should_be_killed": False,
                "progress_message": None,
                "polio_notification_import_id": 10,
            },
        )


@time_machine.travel(CREATED_AT, tick=True)
class IasoTasksTestCase(APITestCase):
    @classmethod
    def setUp(cls):
        source = m.DataSource.objects.create(name="Valley Championship")
        old_version = m.SourceVersion.objects.create(number=1, data_source=source)
        cls.new_version = m.SourceVersion.objects.create(number=2, data_source=source)

        cls.account = m.Account(name="Cobra Kai", default_version=cls.new_version)
        cls.account.save()

        cls.project = m.Project(name="The Show", app_id="com.cobrakai.show", account=cls.account)
        cls.project.save()

        org_unit_type = m.OrgUnitType(name="Dojo", short_name="dojo")
        org_unit_type.save()
        cls.project.unit_types.add(org_unit_type)
        source.projects.add(cls.project)
        m.OrgUnit.objects.create(version=old_version, name="Myagi", org_unit_type=org_unit_type, source_ref="nomercy")
        cls.source = source
        cls.johnny = cls.create_user_with_profile(
            username="johnny", account=cls.account, permissions=[CORE_DATA_TASKS_PERMISSION]
        )
        cls.miguel = cls.create_user_with_profile(username="miguel", account=cls.account, permissions=[])

    def test_tasks_user_without_permissions_access(self):
        self.client.force_authenticate(self.miguel)
        response = self.client.get("/api/tasks/")
        self.assertEqual(response.status_code, 403)

    def test_tasks_user_can_access(self):
        """
        Permission iaso_data_tasks is required to access tasks.
        """
        self.client.force_authenticate(self.johnny)

        task = m.Task.objects.create(
            progress_value=1,
            end_value=1,
            account=self.account,
            created_by=self.johnny,
            status=SUCCESS,
            name="The best task",
        )

        response = self.client.get("/api/tasks/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["tasks"][0]["name"], "The best task")
        self.assertEqual(response.json()["tasks"][0]["status"], SUCCESS)
        self.assertEqual(response.json()["tasks"][0]["id"], task.id)
        self.assertEqual(response.json()["tasks"][0]["end_value"], 1)
        self.assertEqual(response.json()["tasks"][0]["created_by"]["username"], "johnny")

    def test_user_without_tasks_permission_can_only_access_own_tasks(self):
        """
        A user can access a task they launched themselves
        """
        self.client.force_authenticate(self.miguel)

        task_by_miguel = m.Task.objects.create(
            account=self.miguel.iaso_profile.account,
            created_by=self.miguel,
        )
        response = self.client.get(f"/api/tasks/{task_by_miguel.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], task_by_miguel.id)

        """
        But not one launched by someone else
        """
        task_by_johnny = m.Task.objects.create(
            account=self.johnny.iaso_profile.account,
            created_by=self.johnny,
        )
        response = self.client.get(f"/api/tasks/{task_by_johnny.id}/")
        self.assertEqual(response.status_code, 403)

    def test_relaunch_task(self):
        """
        A user can relaunch a task they launched themselves
        """
        self.client.force_authenticate(self.miguel)

        task_by_miguel = m.Task.objects.create(
            account=self.miguel.iaso_profile.account,
            created_by=self.miguel,
            status=ERRORED,
            params={
                "args": [],
                "kwargs": {
                    "user_id": 1,
                    "password": "XXXXXXXXXX",
                    "project_id": self.project.id,
                },
                "method": "export_mobile_app_setup_for_user",
                "module": "iaso.tasks.export_mobile_app_setup_for_user",
            },
        )

        response = self.client.patch(f"/api/tasks/{task_by_miguel.id}/relaunch/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], task_by_miguel.id)

        """
        But not one launched by someone else
        """
        task_by_johnny = m.Task.objects.create(
            account=self.johnny.iaso_profile.account,
            created_by=self.johnny,
        )
        response = self.client.get(f"/api/tasks/{task_by_johnny.id}/")
        self.assertEqual(response.status_code, 403)

    def test_relaunch_task_status_fail(self):
        """
        A user can relaunch a task only when said task is in status ERRORED
        """
        self.client.force_authenticate(self.miguel)

        task_by_miguel = m.Task.objects.create(
            account=self.miguel.iaso_profile.account,
            created_by=self.miguel,
            status=QUEUED,
        )

        response = self.client.patch(f"/api/tasks/{task_by_miguel.id}/relaunch/")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["status"], "You cannot relaunch a task with status QUEUED.")

    def test_tasks_filtering(self):
        """
        Filtering tasks on: users, start_date, end_date, task_type, status
        """
        superuser = self.create_user_with_profile(username="super", account=self.account, is_superuser=True)
        self.client.force_authenticate(superuser)

        # Some useful timestamps
        started_at = datetime.datetime(2024, 1, 20, 15, 0, 0, 0, tzinfo=timezone.utc)
        ended_at = datetime.datetime(2024, 2, 10, 15, 0, 0, 0, tzinfo=timezone.utc)

        # Create a few tasks for user Johnny
        task_1 = m.Task.objects.create(
            account=self.account,
            created_by=self.johnny,
            status=SUCCESS,
            name="export_mobile_app_setup",
            started_at=started_at,
            ended_at=ended_at,
        )
        task_2 = m.Task.objects.create(
            account=self.account,
            created_by=self.johnny,
            status=ERRORED,
            name="import_gpkg_task",
            started_at=started_at,
        )
        task_3 = m.Task.objects.create(
            account=self.account,
            created_by=self.johnny,
            status=QUEUED,
            name="run_deduplication_algo",
        )

        # Create a few tasks for user Miguel
        task_4 = m.Task.objects.create(
            account=self.account,
            created_by=self.miguel,
            status=RUNNING,
            name="process_mobile_bulk_upload",
            started_at=started_at,
        )
        task_5 = m.Task.objects.create(
            account=self.account,
            created_by=self.miguel,
            status=EXPORTED,
            name="org_unit_bulk_update",
            started_at=started_at,
            ended_at=ended_at,
        )

        # No filter: all tasks are returned
        response = self.client.get("/api/tasks/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["tasks"]), 5)

        # Filter on user id
        response = self.client.get(f"/api/tasks/?users={self.johnny.id}")
        task_ids = [t["id"] for t in response.json()["tasks"]]
        self.assertEqual(task_ids, [task_3.id, task_2.id, task_1.id])

        # Filter on task type
        response = self.client.get("/api/tasks/?task_type=run_deduplication_algo")
        task_ids = [t["id"] for t in response.json()["tasks"]]
        self.assertEqual(task_ids, [task_3.id])

        # Filter on status
        response = self.client.get("/api/tasks/?status=SUCCESS,QUEUED")
        task_ids = [t["id"] for t in response.json()["tasks"]]
        self.assertEqual(task_ids, [task_3.id, task_1.id])

        # Filter on date
        # created_at
        response = self.client.get("/api/tasks/?start_date=19-12-2023&end_date=21-12-2023")
        self.assertEqual(len(response.json()["tasks"]), 5)
        # started_at
        response = self.client.get("/api/tasks/?start_date=19-01-2024&end_date=21-01-2024")
        task_ids = [t["id"] for t in response.json()["tasks"]]
        self.assertEqual(task_ids, [task_5.id, task_4.id, task_2.id, task_1.id])
        # ended_at
        response = self.client.get("/api/tasks/?start_date=09-02-2024&end_date=11-02-2024")
        task_ids = [t["id"] for t in response.json()["tasks"]]
        self.assertEqual(task_ids, [task_5.id, task_1.id])

        # Filter on several attrs at once
        response = self.client.get(
            f"/api/tasks/?users={self.miguel.id}&start_date=09-02-2024&end_date=11-02-2024&status=EXPORTED"
        )
        task_ids = [t["id"] for t in response.json()["tasks"]]
        self.assertEqual(task_ids, [task_5.id])

    def test_logs_not_found(self):
        self.client.force_authenticate(self.johnny)
        response = self.client.get("/api/tasks/100000/logs/")
        self.assertEqual(response.status_code, 404)

    def test_logs_not_authenticated(self):
        task = m.Task.objects.create(
            progress_value=1,
            end_value=1,
            account=self.account,
            created_by=self.johnny,
            status=SUCCESS,
            name="The best task",
        )
        response = self.client.get(f"/api/tasks/{task.id}/logs/")
        self.assertEqual(response.status_code, 401)

    def test_logs_authenticated(self):
        task = m.Task.objects.create(
            progress_value=1,
            end_value=1,
            account=self.account,
            created_by=self.johnny,
            status=SUCCESS,
            name="The best task",
        )
        task2 = m.Task.objects.create(
            progress_value=1,
            end_value=1,
            account=self.account,
            created_by=self.johnny,
            status=SUCCESS,
            name="The best task",
        )

        m.TaskLog.objects.create(task=task, message="We have the best task.")
        m.TaskLog.objects.create(task=task, message="Simply the best task.")
        m.TaskLog.objects.create(task=task, message="You can't believe how good this task is.")

        m.TaskLog.objects.create(task=task2, message="We have the worst task.")
        m.TaskLog.objects.create(task=task2, message="Simply the worst task.")
        self.client.force_authenticate(self.johnny)
        response = self.client.get(f"/api/tasks/{task.id}/logs/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], SUCCESS)
        self.assertEqual(len(response.json()["logs"]), 3)
        self.assertEqual(response.json()["logs"][0]["message"], "We have the best task.")
        self.assertEqual(response.json()["logs"][1]["message"], "Simply the best task.")
        self.assertEqual(response.json()["logs"][2]["message"], "You can't believe how good this task is.")
