from django.contrib import messages
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.shortcuts import render, redirect
from django.utils.translation import ugettext as _
from rq.exceptions import NoSuchJobError

from hat.rq.utils import get_task_status

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


def task_status(request, task_id: str, back_view: str, texts: dict):
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


def paginate(request, objects, prefix_url: str, page_size=25) -> dict:
    paginator = Paginator(objects, page_size)

    page = request.GET.get('page')
    try:
        items = paginator.page(page)
    except PageNotAnInteger:
        # If page is not an integer, deliver first page.
        items = paginator.page(1)
    except EmptyPage:
        # If page is out of range (e.g. 9999), deliver last page of results.
        items = paginator.page(paginator.num_pages)

    next_url = None
    prev_url = None

    if items.has_next():
        qs = request.GET.copy()
        qs['page'] = items.next_page_number()
        next_url = prefix_url + qs.urlencode()
    if items.has_previous():
        qs = request.GET.copy()
        qs['page'] = items.previous_page_number()
        prev_url = prefix_url + qs.urlencode()

    return {
        'items': items,
        'count': objects.count(),
        'next_url': next_url,
        'prev_url': prev_url,
    }
