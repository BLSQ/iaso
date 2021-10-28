import decimal
import importlib
import json
from datetime import datetime
from iaso.models.base import Task, RUNNING, QUEUED, KILLED
import boto3
import dateparser
from django.conf import settings
from django.db import connection
from django.utils import timezone

from logging import getLogger

logger = getLogger(__name__)


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
        """run a task, called by the view that receives them from the queue"""
        kwargs["_immediate"] = True
        task = Task.objects.get(id=task_id)
        if task.status == QUEUED:  # ensure a task is only run once
            task.status = RUNNING
            task.started_at = timezone.now()
            task.save()
            module = importlib.import_module(module_name)
            method = getattr(module, method_name)
            assert method._is_task

            method(*args, task=task, **kwargs)

            task.refresh_from_db()
            if task.status == RUNNING:
                logger.warning(f"Task {task} still in status RUNNING after execution")

    def enqueue(self, module_name, method_name, args, kwargs, task_id):
        body = json.dumps(
            {"module": module_name, "method": method_name, "task_id": task_id, "args": args, "kwargs": kwargs},
            default=json_dump,
        )
        return self._enqueue(body)


class PostgresTaskService(_TaskServiceBase):
    def _enqueue(self, body):
        cursor = connection.cursor()
        cursor.execute("NOTIFY NEW_TASK, ''")
        return {"result": "recorded into DB"}

    def run_task(self, task):
        params = task.params
        print(params)
        if not (params and "module" in params and "method" in params):
            # This is for old task that may be in the DB but are not in the new system
            logger.warning(f"Skipping {task} missing method in params: {params}")
            task.status = KILLED
            task.save()
            return
        self.run(params["module"], params["method"], task.id, params["args"], params["kwargs"])

    def run_all(self):
        """run everything in the queue"""
        # clear on_commit stuff

        if connection.in_atomic_block:
            while connection.run_on_commit:
                sids, func = connection.run_on_commit.pop(0)
                func()
        count = 0
        task = Task.objects.filter(status=QUEUED).first()
        while task:
            self.run_task(task)
            logger.info("=" * 20 + " End task exec " + "=" * 20)
            # Fetch next task
            task = Task.objects.filter(status=QUEUED).first()
            count += 1
        return count


class TaskService(_TaskServiceBase):
    def _enqueue(self, body):
        sqs = boto3.client("sqs", region_name=settings.BEANSTALK_SQS_REGION)
        return sqs.send_message(QueueUrl=settings.BEANSTALK_SQS_URL, MessageAttributes={}, MessageBody=body)
