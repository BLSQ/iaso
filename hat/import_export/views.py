import json
from pathlib import PurePath
from django.contrib.auth.decorators import login_required, permission_required
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.core.urlresolvers import reverse
from .forms import UploadMdbFilesForm, DownloadCsvForm
from hat.common.utils import create_shared_filename
from hat.import_export.tasks import import_files_task, export_task
from hat.rq import get_task_status, get_task_result


@login_required()
@permission_required('participants.import_mdb')
@require_http_methods(['GET', 'POST'])
def upload(request):
    if request.method == 'POST':
        form = UploadMdbFilesForm(request.POST, request.FILES)
        if form.is_valid():
            form_files = request.FILES.getlist('file')
            fileinfos = []

            # write files to shared data
            for file in form_files:
                suffix = PurePath(file.name).suffix.lower()
                filename = create_shared_filename(suffix)
                with open(filename, 'wb') as fd:
                    fd.write(file.read())
                fileinfos.append((file.name, filename))

            # run import task
            task = import_files_task.delay(fileinfos, store=True)
            return redirect('import_export:upload_state', task_id=task.id)
    else:
        form = UploadMdbFilesForm()
    return render(request, 'import_export/upload.html', {'form': form})


@login_required()
@permission_required('participants.import_mdb')
@require_http_methods(['GET'])
def upload_state(request, task_id):
    status = get_task_status(task_id)
    if status != 'finished':
        return render(request, 'import_export/upload_state.html', {'status': status})
    return redirect('import_export:upload_done', task_id=task_id)


@login_required()
@permission_required('participants.import_mdb')
@require_http_methods(['GET'])
def upload_done(request, task_id):
    results = get_task_result(task_id)
    for result in results:
      result['ok'] = len(result['errors']) == 0
    resultJSON = json.dumps(results, indent=2)
    return render(request, 'import_export/upload_done.html', {'results': results, 'resultJSON': resultJSON})


@login_required()
@permission_required('participants.export_full')
@require_http_methods(['GET', 'POST'])
def download(request):
    if request.method == 'POST':
        form = DownloadCsvForm(request.POST)
        if form.is_valid():
            r = export_task.delay()
            return redirect('import_export:download_state', task_id=r.id)
    else:
        form = DownloadCsvForm()
    return render(request, 'import_export/download.html', {'form': form})


@login_required()
@permission_required('participants.export_full')
@require_http_methods(['GET'])
def download_state(request, task_id):
    status = get_task_status(task_id)
    if status != 'finished':
        return render(request, 'import_export/download_state.html', {'status': status})
    return redirect('import_export:download_done', task_id=task_id)


@login_required()
@permission_required('participants.export_full')
@require_http_methods(['GET'])
def download_done(request, task_id):
    url = reverse('import_export:download_get', args=(task_id,))
    return render(request, 'import_export/download_done.html',
                  {'download_link': url})


@login_required()
@permission_required('participants.export_full')
@require_http_methods(['GET'])
def download_get(request, task_id):
    result = get_task_result(task_id)
    response = HttpResponse(result, content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="hat.csv"'
    return response
