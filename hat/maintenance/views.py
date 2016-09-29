from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.decorators.http import require_http_methods
from django.shortcuts import render, redirect
from hat.rq.utils import run_task, get_task_status
from rq.exceptions import NoSuchJobError
from django.contrib import messages
from django.utils.translation import ugettext as _


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def index(request):
    from django.conf import settings
    from hat.cases.models import Case
    import hat.couchdb.api as couchdb
    num_transformed = Case.objects.count()
    r = couchdb.get(settings.COUCHDB_DB)
    r.raise_for_status()
    print('json', r.json())
    num_raw = r.json()['doc_count']
    # To account for the design doc we simply subtract one. These is just
    # an assummption. If we will have non raw docs or more than one design
    # doc in couchdb, it will be incorrect.
    num_raw = num_raw - 1
    context = {'num_transformed': num_transformed, 'num_raw': num_raw, 'show_raw_data_button': settings.DEBUG}
    return render(request, 'maintenance/index.html', context)


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def status(request, task_id: str):
    try:
        status = get_task_status(task_id, user=request.user)
    except NoSuchJobError:
        messages.add_message(
            request,
            messages.INFO,
            _('This task is expired, you can start a new job below')
        )
        return redirect('maintenance:index')

    if status != 'finished':
        return render(request, 'maintenance/status.html', {'status': status})
    messages.add_message(request, messages.SUCCESS, _('Task done.'))
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
