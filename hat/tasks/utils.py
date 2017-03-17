from typing import List, Dict
import logging
from typing import Any
from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from django_rq import get_connection
from rq import Connection
from rq.exceptions import NoSuchJobError
from rq.job import Job

logger = logging.getLogger(__name__)


def run_task(task: Job,
             args: List=None,
             kwargs: Dict=None,
             permission: str=None,
             superuser: bool=False) -> Job:
    if args is None:
        args = []
    if kwargs is None:
        kwargs = {}
    job = task.delay(*args, **kwargs)
    if permission or superuser:
        if permission:
            job.meta['permission_required'] = permission
            job.meta['superuser_required'] = superuser
        job.save()
    return job


def raise_on_permission(job: Job, user: User) -> None:
    require_superuser = job.meta.get('superuser_required', None)
    if require_superuser and (not user or not user.is_superuser):
        raise PermissionDenied()
    perm = job.meta.get('permission_required', None)
    if (perm and
        (not user or
         (not user.has_perm(perm) and not user.is_superuser))):
        # User does not have permission
        raise PermissionDenied()


def get_task_status(id: str, user: User=None) -> str:
    '''
    Return the status, can be one of:
    - queued
    - finished
    - failed
    - started
    - deferred
    '''
    with Connection(get_connection()) as conn:
        try:
            job = Job.fetch(id, conn)
            raise_on_permission(job, user)
        except NoSuchJobError:
            return 'notfound'
        return job.status


def get_task_result(id: str, user: User=None) -> Any:
    '''Return the tasks return value which is stored in redis.'''
    with Connection(get_connection()) as conn:
        job = Job.fetch(id, conn)
        raise_on_permission(job, user)
        return job.result
