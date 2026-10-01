"""Declarations for throttling background tasks, see `task_decorator(throttle=...)`.

    @task_decorator(
        task_name="process_mobile_bulk_upload",
        throttle=Throttle(
            concurrency=[
                Concurrency("global", limit=5),
                Concurrency("account", limit=2, key=lambda task, **kwargs: task.account_id),
            ]
        ),
    )

Every task also has the built-in limits `global`, `account` and `user` (see BUILTIN_CONCURRENCIES), unlimited unless
configured: any task can be throttled from the config, without changing its code.

Limits are only enforced by the SQS `TaskService` (the Postgres listener runs one task at a time anyway) and are
evaluated right before the task starts. A task that is over a limit stays QUEUED and is retried later with an
exponential backoff.

The limits in the code are defaults: they can be changed without deploying in the `task_throttles` Config
(see `THROTTLE_CONFIG_SLUG` in services.py), using the task name and the `Concurrency` names:

    {
        "process_mobile_bulk_upload": {
            "global": 5,
            "account": {"default": 2, "keys": {"42": 4}},
            "paused": false
        }
    }

A limit of `null` means unlimited, `"keys"` holds overrides per value of the `Concurrency` key, and `"paused": true`
keeps every run of the task waiting.
"""

import importlib
import pkgutil

from dataclasses import dataclass
from logging import getLogger
from typing import Any, Callable, Dict, Optional, Sequence, Union

from django.apps import apps


logger = getLogger(__name__)


@dataclass(frozen=True)
class Concurrency:
    """At most `limit` runs of the task at the same time, per value returned by `key` (or in total without `key`).

    `limit` and `key` can be callables, called with the Task and the task kwargs: `limit(task, **kwargs)`.
    """

    name: str
    limit: Union[int, None, Callable[..., Optional[int]]] = None
    key: Optional[Callable[..., Any]] = None


@dataclass(frozen=True)
class Throttle:
    concurrency: Sequence[Concurrency] = ()


def _account_key(task, **kwargs):
    return task.account_id


def _user_key(task, **kwargs):
    return task.launcher_id


# Limits every task has, since they only need the Task. They are unlimited unless set in the `task_throttles` Config,
# so a task can be throttled without changing its code. A task can redefine them in its `throttle`.
BUILTIN_CONCURRENCIES = (
    Concurrency("global"),
    Concurrency("account", key=_account_key),
    Concurrency("user", key=_user_key),
)


def effective_throttle(throttle: Optional[Throttle]) -> Throttle:
    """The limits declared by the task, followed by the built-in ones it doesn't redefine."""
    declared = list(throttle.concurrency) if throttle else []
    names = {concurrency.name for concurrency in declared}
    return Throttle(concurrency=declared + [c for c in BUILTIN_CONCURRENCIES if c.name not in names])


# task name -> Throttle declared in the code (None if none), filled by `task_decorator` when a task module is imported
TASKS: Dict[str, Optional[Throttle]] = {}


def register_task(task_name: str, throttle: Optional[Throttle]) -> None:
    # a task name can be reused (e.g. in tests): don't forget the throttle of the real task
    if throttle or task_name not in TASKS:
        TASKS[task_name] = throttle


def discover_tasks() -> Dict[str, Optional[Throttle]]:
    """Import the `tasks` modules of the installed apps, so that TASKS lists all the tasks."""
    for app_config in apps.get_app_configs():
        package_name = f"{app_config.name}.tasks"
        try:
            package = importlib.import_module(package_name)
        except ModuleNotFoundError as e:
            if e.name != package_name:
                logger.exception(f"Could not import {package_name} to discover its tasks")
            continue
        for module in pkgutil.walk_packages(getattr(package, "__path__", []), prefix=f"{package.__name__}."):
            try:
                importlib.import_module(module.name)
            except Exception:
                logger.exception(f"Could not import {module.name} to discover its tasks")
    return TASKS
