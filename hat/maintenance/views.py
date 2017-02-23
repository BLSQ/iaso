from django.db import connection
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render, redirect
from django.utils.translation import ugettext as _
from django.views.decorators.http import require_http_methods

from hat.common.view_utils import task_status
from hat.rq.utils import run_task


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def index(request):
    from django.conf import settings
    from hat.cases.models import Case, DuplicatesPair
    import hat.couchdb.api as couchdb
    from hat.sync.models import DeviceDB
    num_transformed = Case.objects.count()
    r = couchdb.get(settings.COUCHDB_DB)
    r.raise_for_status()

    with connection.cursor() as cursor:
        cursor.execute('SELECT count(*) FROM hat_event')
        num_events = cursor.fetchone()[0]

    context = {
        'num_events': num_events,
        'num_transformed': num_transformed,
        'num_duplicates': DuplicatesPair.objects.count(),
        'num_devices': DeviceDB.objects.count()
    }
    return render(request, 'maintenance/index.html', context)


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def status(request, task_id: str):
    return task_status(request,
                       task_id=task_id,
                       back_view='maintenance:done',
                       texts={
                           'title': _('Maintenance'),
                           'expired': _('This task is expired, you can start a new job below'),
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
def download_events(request):
    import pandas
    from django.http import HttpResponse
    sql = '''
        SELECT stamp, created, updated, deleted, total, type, name
        FROM hat_event_view ORDER BY stamp DESC
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
def import_synced(request):
    from hat.import_export.tasks import import_synced_devices_task
    task = run_task(import_synced_devices_task, superuser=True)
    return redirect('maintenance:status', task_id=task.id)
