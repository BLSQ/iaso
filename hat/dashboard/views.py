from uuid import uuid4
from pathlib import PurePath
from django.contrib.auth.decorators import login_required, permission_required
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.core.urlresolvers import reverse
from django.conf import settings
from rq import Connection
from rq.job import Job
from rq.exceptions import NoSuchJobError
from hat.rq.connection import redis_conn
from .forms import UploadMdbFilesForm, DownloadCsvForm
from hat.historic.tasks import import_files, export


@login_required()
@require_http_methods(['GET'])
def index(request):
    return render(request, 'dashboard/index.html')


@login_required()
@permission_required('participants.import_mdb')
@require_http_methods(['GET', 'POST'])
def upload(request):
    if request.method == 'POST':
        form = UploadMdbFilesForm(request.POST, request.FILES)
        if form.is_valid():
            form_files = request.FILES.getlist('file')
            fileinfos = []
            for file in form_files:
                # write files to shared data
                suffix = PurePath(file.name).suffix.lower()
                dest_path = '{}/{}.{}'.format(
                    settings.SHARED_DIR, str(uuid4()), suffix)
                with open(dest_path, 'wb') as dest_file:
                    dest_file.write(file.read())
                fileinfos.append((file.name, dest_path))
            # run import task
            r = import_files.delay(fileinfos)
            url = reverse('dashboard:upload_state', args=(r.id,))
            return HttpResponseRedirect(url)
    else:
        form = UploadMdbFilesForm()
    return render(request, 'dashboard/upload.html', {'form': form})


def check_task(request, task_id, template, redirect_url):
    with Connection(redis_conn) as conn:
        try:
            job = Job.fetch(task_id, conn)
        except NoSuchJobError:
            return render(request, template, {'status': 'Error: task not found!'})
        if job.status == 'failed':
            return render(request, template, {'status': 'Error: task failed!'})
        if job.status == 'finished':
            url = reverse(redirect_url, args=(task_id,))
            return HttpResponseRedirect(url)
        return render(request, template, {'status': job.status})


@login_required()
@permission_required('participants.import_mdb')
@require_http_methods(['GET'])
def upload_state(request, task_id):
    return check_task(request, task_id,
                      'dashboard/upload_state.html',
                      'dashboard:upload_done')


@login_required()
@permission_required('participants.import_mdb')
@require_http_methods(['GET'])
def upload_done(request, task_id):
    import json
    with Connection(redis_conn) as conn:
        job = Job.fetch(task_id, conn)
        result = json.dumps(job.result, indent=2)
    return render(request, 'dashboard/upload_done.html', {'result': result})


@login_required()
@permission_required('participants.export_full')
@require_http_methods(['GET', 'POST'])
def download(request):
    if request.method == 'POST':
        form = DownloadCsvForm(request.POST)
        if form.is_valid():
            r = export.delay()
            url = reverse('dashboard:download_state', args=(r.id,))
            return HttpResponseRedirect(url)
    else:
        form = DownloadCsvForm()
    return render(request, 'dashboard/download.html', {'form': form})


@login_required()
@permission_required('participants.export_full')
@require_http_methods(['GET'])
def download_state(request, task_id):
    return check_task(request, task_id,
                      'dashboard/download_state.html',
                      'dashboard:download_done')
    # with Connection(redis_conn) as conn:
    #     try:
    #         job = Job.fetch(task_id, conn)
    #     except NoSuchJobError:
    #         return render(request, 'dashboard/download_state.html',
    #                       {'status': 'job not found error'})
    #     if job.status == 'failed':
    #         return render(request, 'dashboard/download_state.html',
    #                       {'status': 'job failed'})
    #     if job.status == 'finished':
    #         url = reverse('dashboard:download_done', args=(task_id,))
    #         return HttpResponseRedirect(url)
    #     return render(request, 'dashboard/download_state.html',
    #                   {'status': job.status})


@login_required()
@permission_required('participants.export_full')
@require_http_methods(['GET'])
def download_done(request, task_id):
    url = reverse('dashboard:download_get', args=(task_id,))
    return render(request, 'dashboard/download_done.html',
                  {'download_link': url})


@login_required()
@permission_required('participants.export_full')
@require_http_methods(['GET'])
def download_get(request, task_id):
    with Connection(redis_conn) as conn:
        job = Job.fetch(task_id, conn)
        result = job.result
    response = HttpResponse(result, content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="hat.csv"'
    return response
