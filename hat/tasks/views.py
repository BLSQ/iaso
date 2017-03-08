from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import FileResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.translation import ugettext as _
from django.views.decorators.http import require_http_methods
from rq.exceptions import NoSuchJobError

from .utils import get_task_status, get_task_result


@login_required()
@require_http_methods(['GET'])
def task_state(request,
               task_id: str,
               next_view: str,
               expired_view: str,
               error_view: str,
               texts: dict,
               ):

    if not expired_view:
        expired_view = next_view
    if not error_view:
        error_view = next_view

    try:
        status = get_task_status(task_id, user=request.user)
    except NoSuchJobError:
        messages.add_message(request, messages.INFO, get_message(texts, 'expired'))
        return send_to(request, task_id=task_id, view=expired_view)

    if status == 'failed':
        messages.add_message(request, messages.ERROR, get_message(texts, status))
        return send_to(request, task_id=task_id, view=error_view)

    elif status != 'finished':
        return render(request, 'tasks/status.html', {
            'task_id': task_id,
            'status': get_message(texts, status),
            'title': get_message(texts, 'title'),
            'heading': get_message(texts, 'inprogress'),
            'complete': False,
        })

    messages.add_message(request, messages.SUCCESS, get_message(texts, status))
    return send_to(request, task_id=task_id, view=next_view)


@login_required()
@require_http_methods(['GET'])
def task_done(request,
              task_id: str,
              expired_view: str,
              template: str,
              post_action,
              texts: dict,
              ):
    try:
        status = get_task_status(task_id, user=request.user)
    except NoSuchJobError:
        messages.add_message(request, messages.INFO, get_message(texts, 'expired'))
        return send_to(request, task_id=task_id, view=expired_view)

    if status == 'finished':
        raw_result = get_task_result(task_id, user=request.user)
        if post_action:
            clean_result = post_action(request, raw_result)
        else:
            clean_result = raw_result

    if not template:
        template = 'tasks/status.html'

    return render(request, template, {
        'task_id': task_id,
        'title': get_message(texts, 'title'),
        'heading': get_message(texts, 'complete'),
        'complete': True,
        **clean_result,
    })


@login_required()
@require_http_methods(['GET'])
def download_get(request, task_id: str, filename: str, error_view: str, texts: dict):
    try:
        file = get_task_result(task_id, user=request.user)
    except NoSuchJobError:
        messages.add_message(request, messages.ERROR, get_message(texts, 'download_error'))
        return send_to(request, task_id=task_id, view=error_view)

    try:
        response = FileResponse(open(file, 'rb'))
    except Exception:
        messages.add_message(request, messages.ERROR, get_message(texts, 'download_error'))
        return send_to(request, task_id=task_id, view=error_view)

    response['Content-Disposition'] = 'attachment; filename="' + filename + '"'
    return response


################################################################################
# helpers
################################################################################

default_messages = {
    # task status
    'deferred': _('Task deferred.'),
    'expired': _('This task is expired.'),
    'failed':  _('Task failed.  Please try again.'),
    'finished':  _('Task done.'),
    'queued':  _('Task in queue.'),
    'started': _('Task started.'),

    # page texts
    'complete': _('Task complete.'),
    'inprogress': _('Task in progress...'),
    'title': _('Task status'),
    'download_error': _('Could not get the file.'),
}


def get_message(msgs: list, msg_id: str) -> str:
    msg = None
    if msg_id in msgs:
        msg = msgs[msg_id]
    if msg is None and msg_id in default_messages:
        msg = default_messages[msg_id]
    if msg is None:
        msg = msg_id
    return msg


def send_to(request, task_id: str, view: str):
    url = reverse(view, kwargs={'task_id': task_id})
    return redirect(url + '?' + request.GET.urlencode())
