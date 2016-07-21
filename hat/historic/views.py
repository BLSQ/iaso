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
from .tasks import import_mdbfiles, export_csv


@login_required()
@require_http_methods(['GET'])
def index(request):
    return render(request, 'historic.html')


@login_required()
@permission_required('participants.import_mdb')
@require_http_methods(['GET', 'POST'])
def upload(request):
    if request.method == 'POST':
        form = UploadMdbFilesForm(request.POST, request.FILES)
        if form.is_valid():
            form_files = request.FILES.getlist('file')
            shared_files = []
            for file in form_files:
                # write files to shared data
                dest_path = settings.SHARED_DIR + '/' + file.name
                with open(dest_path, 'wb') as dest_file:
                    dest_file.write(file.read())
                shared_files.append(dest_path)
            # run import task
            r = import_mdbfiles.delay(shared_files)
            url = reverse('historic:upload_state', args=(r.id,))
            return HttpResponseRedirect(url)
    else:
        form = UploadMdbFilesForm()
    return render(request, 'upload.html', {'form': form})


@login_required()
@permission_required('participants.import_mdb')
@require_http_methods(['GET'])
def upload_state(request, task_id):
    with Connection(redis_conn) as conn:
        try:
            job = Job.fetch(task_id, conn)
        except NoSuchJobError:
            return render(request, 'upload_state.html', {'status': 'job not found error'})

        if job.status == 'failed':
            return render(request, 'download_state.html', {'status': 'job failed'})
        if job.status == 'finished':
            url = reverse('historic:upload_done', args=(task_id,))
            return HttpResponseRedirect(url)
        return render(request, 'upload_state.html', {'status': job.status})


@login_required()
@permission_required('participants.import_mdb')
@require_http_methods(['GET'])
def upload_done(request, task_id):
    import json
    with Connection(redis_conn) as conn:
        job = Job.fetch(task_id, conn)
        result = json.dumps(job.result, indent=2)
    return render(request, 'upload_done.html', {'result': result})


@login_required()
@permission_required('participants.export_full')
@require_http_methods(['GET', 'POST'])
def download(request):
    if request.method == 'POST':
        form = DownloadCsvForm(request.POST)
        if form.is_valid():
            r = export_csv.delay()
            url = reverse('historic:download_state', args=(r.id,))
            return HttpResponseRedirect(url)
    else:
        form = DownloadCsvForm()
    return render(request, 'download.html', {'form': form})


@login_required()
@permission_required('participants.export_full')
@require_http_methods(['GET'])
def download_state(request, task_id):
    with Connection(redis_conn) as conn:
        try:
            job = Job.fetch(task_id, conn)
        except NoSuchJobError:
            return render(request, 'download_state.html', {'status': 'job not found error'})

        if job.status == 'failed':
            return render(request, 'download_state.html', {'status': 'job failed'})
        if job.status == 'finished':
            url = reverse('historic:download_done', args=(task_id,))
            return HttpResponseRedirect(url)
        return render(request, 'download_state.html', {'status': job.status})


@login_required()
@permission_required('participants.export_full')
@require_http_methods(['GET'])
def download_done(request, task_id):
    url = reverse('historic:download_get', args=(task_id,))
    return render(request, 'download_done.html', {'download_link': url})


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
