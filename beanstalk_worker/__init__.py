from functools import wraps
import traceback
from django.utils import timezone
from lazy_services import LazyService
import sentry_sdk
from logging import getLogger

logger = getLogger(__name__)


task_service = LazyService("BEANSTALK_TASK_SERVICE")


def task_decorator(task_name=""):
    def inner_task(func):
        assert func.__name__ == func.__qualname__, f"{func.__qualname__} is not a global"

        @wraps(func)
        def wrapper(*args, **kwargs):
            from iaso.models.base import Task, ERRORED, KilledException

            immediate = kwargs.pop("_immediate", False)  # if true, we need to run the task now, we are a worker
            if immediate:
                the_task = kwargs.pop("task")
                # this might happen if the task is run immediately from command line and did not went through the queue
                if not the_task.name:
                    the_task.name = task_name
                    the_task.save()
                try:
                    logger.info(f"Running task {the_task}")
                    func(*args, task=the_task, **kwargs)
                except KilledException as e:
                    # If it was interrupted in the middle of a transaction the new status was not saved so save it again
                    the_task.save()
                except Exception as e:
                    the_task.status = ERRORED
                    the_task.ended_at = timezone.now()
                    the_task.result = {"result": ERRORED, "message": str(e), "stack_trace": traceback.format_exc()}
                    the_task.save()
                    logger.exception(f"Error when running task {the_task.id}: {the_task}")
                    sentry_sdk.capture_exception(e)
                return the_task
            else:  # enqueue the task
                task = Task()
                user = kwargs.pop("user", None)

                if user:
                    task.account = user.iaso_profile.account
                    task.launcher = user
                task.name = task_name

                # Save it here so we can have the id
                task.save()

                task.params = {"args": args, "kwargs": kwargs, "task_id": task.id}
                task.queue_answer = task_service.enqueue(func.__module__, func.__name__, args, kwargs, task_id=task.id)
                task.save()

                return task

        wrapper._is_task = True
        return wrapper

    return inner_task
