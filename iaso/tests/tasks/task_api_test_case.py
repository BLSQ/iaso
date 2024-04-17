from iaso.models import Task, QUEUED
from beanstalk_worker.services import TestTaskService
from iaso.test import APITestCase


class TaskAPITestCase(APITestCase):
    def runAndValidateTask(self, task, new_status):
        "Run all task in queue and validate that task is run"
        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 1)
        task_service = TestTaskService()
        task_service.run_all()
        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 0)

        response = self.client.get("/api/tasks/%d/" % task.id)
        self.assertEqual(response.status_code, 200)
        # Task completion status
        return self.assertValidTaskAndInDB(response.json(), new_status)

    def assertValidTaskAndInDB(self, task_dict, status="QUEUED", name=None):
        self.assertEqual(task_dict["status"], status, task_dict)

        task = Task.objects.get(id=task_dict["id"])
        self.assertTrue(task)
        if name:
            self.assertEqual(task.name, name)

        return task
