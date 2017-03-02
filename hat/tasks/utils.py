import logging
from typing import Any
from django.contrib import messages
from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from django.utils.translation import ugettext as _
from django.shortcuts import render, redirect
from django_rq import get_connection
from rq import Connection
from rq.exceptions import NoSuchJobError
from rq.job import Job

logger = logging.getLogger(__name__)

default_messages = {
    # task status
    'deferred': _('Task deferred.'),
    'failed':  _('Task failed.  Please try again.'),
    'finished':  _('Task done.'),
    'queued':  _('Task in queue.'),
    'started': _('Task started.'),
    'expired': _('This task is expired.'),
    # page texts
    'title': _('Task status'),
    'running': _('Task running...'),
}


def run_task(task, args=None, kwargs=None, permission=None, superuser=False):
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


def raise_on_permission(job, user: User):
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


def view_task_status(request, task_id: str, back_view: str, texts: dict):
    def get_message(msg_id: str) -> str:
        message = None
        if msg_id in texts:
            message = texts[msg_id]
        if message is None and msg_id in default_messages:
            message = default_messages[msg_id]
        if message is None:
            message = msg_id
        return message

    try:
        status = get_task_status(task_id, user=request.user)
    except NoSuchJobError:
        messages.add_message(request, messages.INFO, get_message('expired'))
        return redirect(back_view, task_id=task_id)

    if status == 'failed':
        messages.add_message(request, messages.ERROR, get_message(status))

    elif status != 'finished':
        return render(request, 'task_status.html', {
            'status': get_message(status),
            'title': get_message('title'),
            'running': get_message('running'),
        })

    else:
        messages.add_message(request, messages.SUCCESS, get_message(status))

    return redirect(back_view, task_id=task_id)
