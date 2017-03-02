import logging
from django.db import connection
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render, redirect
from django.urls import reverse
from django.utils.translation import ugettext as _
from django.views.decorators.http import require_http_methods

from hat.tasks.utils import run_task, view_task_status

logger = logging.getLogger(__name__)


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def index(request):
    from hat.cases.models import Case, DuplicatesPair
    from hat.sync.models import DeviceDBView

    with connection.cursor() as cursor:
        cursor.execute('SELECT count(*) FROM hat_event')
        num_events = cursor.fetchone()[0]

    context = {
        'num_events': num_events,
        'num_transformed': Case.objects.count(),
        'num_duplicates': DuplicatesPair.objects.count(),
        'num_devices': DeviceDBView.objects.count(),
    }
    return render(request, 'maintenance/index.html', context)


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def status(request, task_id: str):
    return view_task_status(request,
                            task_id=task_id,
                            back_view='maintenance:done',
                            texts={
                                'title': _('Maintenance'),
                                'expired': _('This task is expired.'),
                            })


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def done(request, task_id: str):
    return redirect('maintenance:index')


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def delete_db_data(request):
    from hat.cases.models import Case
    try:
        Case.objects.all().delete()
    except Exception as e:
        logger.exception(e)
        messages.add_message(request, messages.ERROR, _('Error: %(error)s') % {'error': e})
    else:
        messages.add_message(request, messages.SUCCESS, _('Task done.'))
    return redirect('maintenance:index')


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def reimport(request):
    from hat.import_export.tasks import reimport_task
    task = run_task(reimport_task, superuser=True)
    return redirect('maintenance:status', task_id=task.id)


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def rebuild_duplicates(request):
    from hat.cases.tasks import duplicates_task
    task = run_task(duplicates_task, superuser=True)
    return redirect('maintenance:status', task_id=task.id)


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def download_events_dump(request):
    from django.http import FileResponse
    from hat.import_export.dump import dump_events
    filename = dump_events()
    response = FileResponse(open(filename, 'rb'))
    response['Content-Disposition'] = 'attachment; filename="hat_events.sql"'
    return response


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def upload_events_dump(request):
    from hat.common.utils import create_shared_filename
    from hat.import_export.dump import load_events_dump
    try:
        filename = create_shared_filename('.sql')
        with open(filename, 'wb') as fd:
            fd.write(request.FILES['file'].read())
        load_events_dump(filename)
    except Exception as e:
        logger.exception(e)
        messages.add_message(request, messages.ERROR, _('Error: %(error)s') % {'error': e})
    else:
        messages.add_message(request, messages.SUCCESS, _('Upload done.'))
    return redirect('maintenance:index')


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def download_events(request):
    import pandas
    from django.http import HttpResponse
    sql = '''
        SELECT stamp, table_name, name, total, created, updated, deleted
          FROM hat_event_view
         ORDER BY stamp DESC
    '''
    with connection.cursor() as cursor:
        cursor.execute(sql)
        log = cursor.fetchall()
        pd = pandas.DataFrame(log, columns=[col[0] for col in cursor.description])
        csv = pd.to_csv(index=False)
        response = HttpResponse(csv, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="hat_log.csv"'
        return response


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def clean_events(request):
    ''' Delete events which have zero stats '''
    sql = '''
        DELETE FROM hat_event WHERE created = 0 AND updated = 0 AND deleted = 0 AND total = 0
    '''
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql)
    except Exception as e:
        logger.exception(e)
        messages.add_message(request, messages.ERROR, _('Error: %(error)s') % {'error': e})
    else:
        messages.add_message(request, messages.SUCCESS, _('Task done.'))
    return redirect('maintenance:index')


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def import_synced(request):
    from hat.import_export.tasks import import_synced_devices_task
    task = run_task(import_synced_devices_task, superuser=True)
    return redirect('maintenance:status', task_id=task.id)


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def devices_list(request):
    from hat.sync.models import DeviceDBView
    from hat.common.paginator import paginate
    items = DeviceDBView.objects.order_by('last_synced_date', 'device_id')
    current_page = paginate(request,
                            objects=items,
                            prefix_url=reverse('maintenance:devices_list') + '?',
                            )
    return render(request, 'devices/list.html', {
        'page': current_page,
    })
