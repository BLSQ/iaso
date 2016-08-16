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
    return render(request, 'maintenance/index.html')


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
def delete_data(request):
    from hat.participants.models import HatParticipant
    try:
        HatParticipant.objects.all().delete()
    except Exception as e:
        messages.add_message(request, messages.ERROR, _('Error: %(error)') % {'error': e})
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
