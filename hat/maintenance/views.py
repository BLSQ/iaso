import logging
from django.db import connection
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render, redirect
from django.urls import reverse
from django.utils.translation import ugettext as _
from django.views.decorators.http import require_http_methods
from django.http.request import HttpRequest
from django.http import HttpResponse

from hat.tasks.utils import run_task

logger = logging.getLogger(__name__)


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def index(request: HttpRequest) -> HttpResponse:
    from hat.cases.models import Case, DuplicatesPair
    from hat.sync.models import DeviceDBView

    with connection.cursor() as cursor:
        cursor.execute('SELECT count(*) FROM hat_event')
        num_events = cursor.fetchone()[0]

    task_id = request.GET.get('task_id', None)
    action = request.GET.get('action', None)
    filename = request.GET.get('filename', None)
    download_link = None
    if action and task_id and filename:
        download_link = reverse('maintenance:get_file', kwargs={
            'task_id': task_id,
            'filename': filename,
        })

    context = {
        # task result
        'action': action,
        'download_link': download_link,
        # details
        'num_events': num_events,
        'num_transformed': Case.objects.count(),
        'num_duplicates': DuplicatesPair.objects.count(),
        'num_devices': DeviceDBView.objects.count(),
    }
    return render(request, 'maintenance/index.html', context)


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def status(request: HttpRequest, task_id: str) -> HttpResponse:
    from hat.tasks.views import task_state
    return task_state(request,
                      task_id=task_id,
                      next_view='maintenance:done',
                      expired_view='maintenance:done',
                      error_view='maintenance:done',
                      texts={'title': _('Maintenance')},
                      )


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def done(request: HttpRequest, task_id: str) -> HttpResponse:
    url = reverse('maintenance:index')
    return redirect(url + '?task_id={}&{}'.format(task_id, request.GET.urlencode()))


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def get_file(request: HttpRequest, task_id: str, filename: str) -> HttpResponse:
    from hat.tasks.views import download_get
    return download_get(request,
                        task_id=task_id,
                        filename=filename,
                        error_view='maintenance:index',
                        )


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def delete_db_data(request: HttpRequest) -> HttpResponse:
    from hat.cases.models import Case
    try:
        Case.objects.all().delete()
    except Exception as e:
        logger.exception(str(e))
        messages.add_message(request, messages.ERROR, _('Error: %(error)s') % {'error': e})
    else:
        messages.add_message(request, messages.SUCCESS, _('Task done.'))
    return redirect('maintenance:index')


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def reimport(request: HttpRequest) -> HttpResponse:
    from hat.tasks.jobs import reimport_task
    task = run_task(reimport_task, superuser=True)
    return redirect('maintenance:status', task_id=task.id)


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def rebuild_duplicates(request: HttpRequest) -> HttpResponse:
    from hat.tasks.jobs import duplicates_task
    task = run_task(duplicates_task, superuser=True)
    return redirect('maintenance:status', task_id=task.id)


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def download_events_dump(request: HttpRequest) -> HttpResponse:
    from hat.tasks.jobs import dump_events_task
    task = run_task(dump_events_task, superuser=True)
    url = reverse('maintenance:status', kwargs={'task_id': task.id})
    return redirect(url + '?action=events_dump&filename=events_dump.sql')


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def upload_events_dump(request: HttpRequest) -> HttpResponse:
    from hat.common.utils import create_shared_filename
    from hat.tasks.jobs import load_events_dump_task
    try:
        filename = create_shared_filename('.sql')
        uploaded = request.FILES['file']
        with open(filename, 'wb') as fd:
            for chunk in uploaded.chunks():
                fd.write(chunk)
        task = run_task(load_events_dump_task,
                        args=[filename],
                        superuser=True)
        return redirect('maintenance:status', task_id=task.id)

    except Exception as e:
        logger.exception(str(e))
        messages.add_message(request, messages.ERROR, _('Error: %(error)s') % {'error': e})
    else:
        messages.add_message(request, messages.SUCCESS, _('Upload done.'))
    return redirect('maintenance:index')


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def download_events(request: HttpRequest) -> HttpResponse:
    from hat.tasks.jobs import export_task
    fields = 'stamp, table_name, sub_type, name, total, created, updated, deleted'
    sql = 'SELECT {} FROM hat_event_view ORDER BY stamp DESC'.format(fields)
    task = run_task(export_task,
                    kwargs={'sql_sentence': sql},
                    superuser=True
                    )
    url = reverse('maintenance:status', kwargs={'task_id': task.id})
    return redirect(url + '?action=events_csv&filename=events_log.csv')


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def import_synced(request: HttpRequest) -> HttpResponse:
    from hat.tasks.jobs import import_synced_devices_task
    task = run_task(import_synced_devices_task, superuser=True)
    return redirect('maintenance:status', task_id=task.id)


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def devices_list(request: HttpRequest) -> HttpResponse:
    from hat.sync.models import DeviceDBView
    from hat.common.paginator import paginate
    items = DeviceDBView.objects.order_by('last_synced_date', 'device_id')
    current_page = paginate(request,
                            objects=items,
                            prefix_url=reverse('maintenance:devices_list') + '?',
                            )
    return render(request, 'devices/list.html', {'page': current_page})


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def events_list(request: HttpRequest) -> HttpResponse:
    sql = '''
        SELECT id, stamp, table_name, sub_type, name, total, created, updated, deleted
          FROM hat_event_view
         ORDER BY stamp DESC
    '''

    with connection.cursor() as cursor:
        cursor.execute(sql)
        columns = [col[0] for col in cursor.description]
        items = [dict(zip(columns, row)) for row in cursor.fetchall()]

    return render(request, 'events/list.html', {'items': items, 'count': len(items)})
