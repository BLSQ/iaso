import decimal
import importlib
import json
from datetime import datetime
from unittest import mock
from iaso.models.base import Task, RUNNING
import boto3
import dateparser
from django.conf import settings
from django.db import connection
from django.utils import timezone


def json_dump(obj):
    if isinstance(obj, datetime):
        return {"__type__": "datetime", "value": obj.isoformat()}
    elif isinstance(obj, decimal.Decimal):
        return {"__type__": "decimal", "value": str(obj)}
    else:
        assert False, type(obj)


def json_load(obj):
    if "__type__" in obj:
        if obj["__type__"] == "datetime":
            return dateparser.parse(obj["value"])
        elif obj["__type__"] == "decimal":
            return decimal.Decimal(obj["value"])
        else:
            assert False
    else:
        return obj


class _TaskServiceBase:
    def run_task(self, body):
        data = json.loads(body, object_hook=json_load)
        self.run(data["module"], data["method"], data["task_id"], data["args"], data["kwargs"])

    def run(self, module_name, method_name, task_id, args, kwargs):
        """ run a task, called by the view that receives them from the queue """
        kwargs["_immediate"] = True
        task = Task.objects.get(id=task_id)
        task.status = RUNNING
        task.started_at = timezone.now()
        task.save()
        module = importlib.import_module(module_name)
        method = getattr(module, method_name)
        assert method._is_task
        method(*args, task=task, **kwargs)

    def enqueue(self, module_name, method_name, args, kwargs, task_id):
        body = json.dumps(
            {"module": module_name, "method": method_name, "task_id": task_id, "args": args, "kwargs": kwargs},
            default=json_dump,
        )
        return self._enqueue(body)


class FakeTaskService(_TaskServiceBase):
    def __init__(self):
        self.clear()

    def _enqueue(self, body):
        self.queue.append(body)
        return {"result": "recorded into fake queue service"}

    def clear(self):
        """ wipe the test queue """
        self.queue = []

    def run_all(self):
        """ run everything in the test queue """
        # clear on_commit stuff
        print("self.queue", self.queue)
        if connection.in_atomic_block:
            while connection.run_on_commit:
                sids, func = connection.run_on_commit.pop(0)
                func()

        while self.queue:
            self.run_task(self.queue.pop(0))

    def run_task(self, body):
        with mock.patch("django.conf.settings.BEANSTALK_WORKER", True):
            return super().run_task(body)


class TaskService(_TaskServiceBase):
    def _enqueue(self, body):
        sqs = boto3.client("sqs", region_name=settings.BEANSTALK_SQS_REGION)
        return sqs.send_message(QueueUrl=settings.BEANSTALK_SQS_URL, MessageAttributes={}, MessageBody=body)
