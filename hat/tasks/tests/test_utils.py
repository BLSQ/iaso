import time
from django.test import TestCase as DjangoTestCase
from django.core.exceptions import PermissionDenied
from django_rq import job
from ..utils import run_task, get_task_status, get_task_result


@job('default')
def test_task(n):
    time.sleep(n)
    return 'ok'


class MockUser:
    is_superuser = False

    def has_perm(self, _):
        return True


class MockSuperuser:
    is_superuser = True

    def has_perm(self, _):
        return False


class TestCase(DjangoTestCase):

    def test_run_task(self):
        task = run_task(test_task, [0.2])
        status = get_task_status(task.id)
        self.assertEqual(status, 'queued')

        time.sleep(0.1)
        status = get_task_status(task.id)
        self.assertEqual(status, 'started')

        time.sleep(0.3)
        status = get_task_status(task.id)
        self.assertEqual(status, 'finished')

    def test_get_task_result(self):
        task = run_task(test_task, [0])
        time.sleep(0.1)
        r = get_task_result(task.id)
        self.assertEqual(r, 'ok')

    def test_deny_task_result(self):
        task = run_task(test_task, [0], permission='nope')
        time.sleep(0.1)
        with self.assertRaises(PermissionDenied):
            get_task_result(task.id)

    def test_allow_perm_task_result(self):
        task = run_task(test_task, [0], permission='yes')
        time.sleep(0.1)
        get_task_result(task.id, MockUser())

    def test_allow_superuser_task_result(self):
        task = run_task(test_task, [0], permission='maybe')
        time.sleep(0.1)
        get_task_result(task.id, MockSuperuser())
