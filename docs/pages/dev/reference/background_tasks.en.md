# Background tasks & worker

Iaso queue certains functions (task) for later execution, so they can run
outside an HTTP request. This is used for functions that take a long time to execute
so they don't canceled in the middle by a timeout of a connection closed.
e.g: bulk import, modifications or export of OrgUnits.  Theses are the functions
marked by the decorator @task_decorator, when called they get added to a Queue
and get executed by a worker.


The logic is based on a fork of the library
[django-beanstalk-worker](https://pypi.org/project/django-beanstalk-worker/)
from tolomea, please consult it's doc for reference.


If you want to develop a new background task, the endpoint `/api/copy_version/`
is a good example of how to create a task and to plug it to the api.

To call a  function with the @task decorator, you need to pass it a User objects, in addition to
the other function's arguments, this arg represent which user is launching
the task. At execution time the task will receive a iaso.models.Task
instance in argument that should be used to report progress. It's
mandatory for the function, at the end of a successful execution to call
task.report_success() to mark its proper completion.

## Throttling

A task can limit how many of its runs happen at the same time, in total and per key (e.g. per account),
with the `throttle` argument of `@task_decorator`:

```python
@task_decorator(
    task_name="process_mobile_bulk_upload",
    throttle=Throttle(
        concurrency=[
            Concurrency("global", limit=5),
            Concurrency("account", limit=2, key=lambda task, **kwargs: task.account_id),
        ]
    ),
)
```

The limits are checked when the worker is about to start the task. A task over a limit stays `QUEUED`
and is sent back to the SQS queue with an exponential backoff. Only the SQS worker enforces them: the
Postgres worker used in development runs one task at a time.

Every task also has the built-in limits `global`, `account` and `user` (per launching user), unlimited
by default, so any task can be throttled without changing its code.

The limits can be changed without deploying on the Django admin page **Configs › Task throttles**
(`/admin/iaso/config/task-throttles/`), which also shows how many runs use each limit and lets you
throttle any other task. It saves them in the `Config` of slug `task_throttles`, keyed by task name
and `Concurrency` name. `null` means unlimited, `keys` overrides the limit for one key and `paused`
keeps all the runs of the task waiting:

```json
{
    "process_mobile_bulk_upload": {
        "global": 5,
        "account": {"default": 2, "keys": {"42": 4}},
        "paused": false
    }
}
```

The Django admin page **Tasks › Monitor** (`/admin/iaso/task/monitor/`) shows, per task, how many are
queued, throttled, running and finished (success, errored, killed) with their duration, and for each
limit set, the runs using it and waiting for it, per key.

## Lost tasks

While a task runs, the worker refreshes a heartbeat in its `TaskLease` every 30 seconds. When a worker
is killed, the heartbeat stops: after 3 minutes the task no longer occupies its throttle slot, and it is
marked `ERRORED` by `/tasks/reap_lost_tasks/`, called every 5 minutes by sqsd (see `cron.yaml`).

## Run the tasks through SQS locally

By default the development environment runs the tasks with the Postgres worker. To run them like on the
Elastic Beanstalk worker environment, through an SQS queue and an sqsd daemon (and so test the
throttling), use `docker/sqs/docker-compose.yml`. It starts [ElasticMQ](https://github.com/softwaremill/elasticmq)
(an SQS-compatible server) and [simple-sqsd](https://github.com/fterrag/simple-sqsd), which POSTs each
queued task to `/tasks/task/` of the dev server:

```bash
docker compose -f docker-compose.yml -f docker/sqs/docker-compose.yml up iaso elasticmq sqsd
```

The queue statistics are at [http://localhost:9325](http://localhost:9325). `iaso.tasks.dummy_task`
is a task that only waits, handy to test with. To queue 4 runs of 20 seconds, in the running `iaso`
container so that they go through SQS, launched by the first user having an Iaso profile:

```bash
docker compose -f docker-compose.yml -f docker/sqs/docker-compose.yml exec iaso ./manage.py shell -c '
from django.contrib.auth.models import User
from iaso.tasks.dummy_task import dummy_task
user = User.objects.filter(iaso_profile__isnull=False).order_by("id").first()
for i in range(4):
    print(dummy_task(duration=20, label=f"test {i}", user=user))
'
```

Follow them in the task list of the web interface, or on the Task throttles admin page.

The periodic tasks of `cron.yaml` are not run.
