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

    num_raw = r.json()['doc_count']
    # To account for the design doc we simply subtract one from the raw count.
    # That is just an assummption. If we will have non raw docs or more than
    # one design doc in couchdb, it will be incorrect.
    num_raw = num_raw - 1

    context = {
        'num_transformed': num_transformed,
        'num_raw': num_raw,
        'num_duplicates': DuplicatesPair.objects.count(),
        'num_devices': DeviceDB.objects.count(),
        'show_raw_data_button': settings.DEBUG,
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
def delete_couchdb_data(request):
    from django.conf import settings
    import hat.couchdb.api as couchdb
    from hat.couchdb.setup import setup_couchdb
    if settings.DEBUG:
        try:
            couchdb.delete(settings.COUCHDB_DB)
            setup_couchdb()
        except Exception as e:
            messages.add_message(request, messages.ERROR, _('Error: %(error)s') % {'error': e})
        else:
            messages.add_message(request, messages.SUCCESS, _('Task done.'))
    else:
        messages.add_message(request, messages.ERROR, _('Feature not available.'))
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
def download_log(request):
    import pandas
    from django.db import connection
    from django.http import HttpResponse

    sql = '''
        SELECT * FROM cases_history_log_view ORDER BY stamp DESC
    '''
    with connection.cursor() as cursor:
        cursor.execute(sql)
        log = cursor.fetchall()
        pd = pandas.DataFrame(log, columns=[col[0] for col in cursor.description])
        csv = pd.to_csv()
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
