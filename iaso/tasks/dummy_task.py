"""A task that only waits, to test the background workers, the task UI and the throttling in a deployed environment.

From the worker environment (the endpoint of `beanstalk_worker/urls.py`):

    curl -X POST -H "Content-Type: application/json" -d '{"duration": 120, "label": "test 1"}' \
        <worker url>/tasks/launch_task/iaso.tasks.dummy_task.dummy_task/<user_name>/

That endpoint refuses to launch a task already queued or running for the same user, so to launch several at once
(e.g. to reach the throttle limits), use `./manage.py shell`:

    from iaso.tasks.dummy_task import dummy_task
    for i in range(6):
        dummy_task(duration=120, label=f"test {i}", user=User.objects.get(username="..."))

- `fail=True` raises an error at the end, so the task ends as ERRORED.
- `crash=True` kills the worker process halfway, to test the detection of lost tasks. It also kills the other tasks
  running in the same process: don't use it on production.
"""

import os
import time

from logging import getLogger

from beanstalk_worker import task_decorator
from beanstalk_worker.throttle import Throttle


logger = getLogger(__name__)


class DummyTaskError(Exception):
    pass


@task_decorator(
    task_name="dummy_task",
    # Unlimited (global, per account and per user) until set on the Task throttles admin page
    throttle=Throttle(),
)
def dummy_task(duration=10, fail=False, crash=False, label="", task=None):
    duration = int(duration)
    for second in range(duration):
        if crash and second >= duration // 2:
            logger.warning(f"Dummy task {task.id} {label}: killing the worker process {os.getpid()}")
            os._exit(1)
        task.report_progress_and_stop_if_killed(
            progress_value=second, end_value=duration, progress_message=f"{label} waited {second}/{duration}s"
        )
        time.sleep(1)

    if fail:
        raise DummyTaskError(f"Dummy task {label} failed on purpose after {duration}s")
    task.report_success_with_result(
        message=f"{label} waited {duration}s",
        result_data={"duration": duration, "label": label, "pid": os.getpid()},
    )
