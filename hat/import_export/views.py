import json
from pathlib import PurePath
from django.contrib.auth.decorators import login_required, permission_required
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.core.urlresolvers import reverse
from .forms import UploadMdbFilesForm, UploadLocationsFileForm, DownloadCsvForm
from hat.common.utils import create_shared_filename
from hat.import_export.tasks import import_task, export_task, import_locations_task
from hat.rq.utils import run_task, get_task_status, get_task_result
from rq.exceptions import NoSuchJobError
from hat.import_export.errors import error_helper
from django.contrib import messages
from django.utils.translation import ugettext as _


default_messages = {
    'download_expired':  _('''The download job you\'re looking for
                            has expired.  You can create a new download
                            with the button below.'''),
    'upload_expired': _('''The upload job you\'re looking for has expired.
                        It is done but the result can't be viewed any more.''')
}


@login_required()
@permission_required('cases.import')
@require_http_methods(['GET'])
def index(request):
    return render(request, 'import_export/datasets.html')


################################################################################
# Upload cases dataset
################################################################################


@login_required()
@permission_required('cases.import')
@require_http_methods(['GET', 'POST'])
def upload_cases(request):
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
            task = run_task(import_task, args=[fileinfos],
                            permission='cases.import')
            return redirect('datasets:import_cases:state', task_id=task.id)
    else:
        form = UploadMdbFilesForm()
    return render(request, 'import_export/upload.html', {'form': form})


@login_required()
@permission_required('cases.import')
@require_http_methods(['GET'])
def upload_cases_state(request, task_id):
    try:
        status = get_task_status(task_id, user=request.user)
    except NoSuchJobError:
        message = default_messages['upload_expired']
        messages.add_message(request, messages.INFO, message)
        return redirect('datasets:import_cases:upload')

    if status != 'finished':
        return render(request, 'import_export/upload_state.html', {'status': status})
    return redirect('datasets:import_cases:done', task_id=task_id)


@login_required()
@permission_required('cases.import')
@require_http_methods(['GET'])
def upload_cases_done(request, task_id):
    try:
        results = get_task_result(task_id, user=request.user)
    except NoSuchJobError:
        message = default_messages['upload_expired']
        messages.add_message(request, messages.INFO, message)
        return redirect('datasets:import_cases:upload')

    for result in results:
        result['ok'] = len(result['errors']) == 0
        # needs to be a list to be converted to JSON
        result['errors'] = list(map(error_helper, result['errors']))
    error_count = len([res for res in results if res['errors']])
    resultJSON = json.dumps(results, indent=2)
    return render(request, 'import_export/upload_done.html', {
        'results': results,
        'resultJSON': resultJSON,
        'error_count': error_count
    })


################################################################################
# Download cases dataset
################################################################################


@login_required()
@permission_required('cases.export')
@require_http_methods(['GET', 'POST'])
def download_cases(request):
    if request.method == 'POST':
        form = DownloadCsvForm(request.POST)
        if form.is_valid():
            options = {
                'start_date': form.cleaned_data['start_date'],
                'end_date': form.cleaned_data['end_date'],
                'sources': form.cleaned_data['sources'],
                'sep': form.cleaned_data['sep'],
            }
            if request.user.has_perm('cases.export_full'):
                task = run_task(export_task, kwargs=options,
                                permission='cases.export_full')
            else:
                task = run_task(export_task, kwargs={'anon': True, **options},
                                permission='cases.export')
            return redirect('datasets:export_cases:state', task_id=task.id)
    else:
        form = DownloadCsvForm()
    return render(request, 'import_export/download.html', {'form': form})


@login_required()
@permission_required('cases.export')
@require_http_methods(['GET'])
def download_cases_state(request, task_id):
    try:
        status = get_task_status(task_id, user=request.user)
    except NoSuchJobError:
        messages.add_message(
            request,
            messages.INFO,
            default_messages['download_expired']
        )
        return redirect('datasets:export_cases:download')

    if status != 'finished':
        return render(request, 'import_export/download_state.html', {'status': status})
    return redirect('datasets:export_cases:done', task_id=task_id)


@login_required()
@permission_required('cases.export')
@require_http_methods(['GET'])
def download_cases_done(request, task_id):
    url = reverse('datasets:export_cases:get', args=(task_id,))
    return render(request, 'import_export/download_done.html',
                  {'download_link': url})


@login_required()
@permission_required('cases.export')
@require_http_methods(['GET'])
def download_cases_get(request, task_id):
    try:
        result = get_task_result(task_id, request.user)
    except NoSuchJobError:
        messages.add_message(
            request,
            messages.INFO,
            default_messages['download_expired']
        )
        return redirect('datasets:export_cases:download')

    response = HttpResponse(result, content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="hat.csv"'
    return response


################################################################################
# Upload locations data
################################################################################


@login_required()
@permission_required('cases.import_locations')
@require_http_methods(['GET', 'POST'])
def upload_locations(request):
    if request.method == 'POST':
        form = UploadLocationsFileForm(request.POST, request.FILES)
        if form.is_valid():
            form_files = request.FILES.getlist('file')
            file = form_files[0]
            suffix = PurePath(file.name).suffix.lower()
            filename = create_shared_filename(suffix)
            with open(filename, 'wb') as fd:
                fd.write(file.read())
            # run import task
            task = run_task(import_locations_task, args=[file.name, filename],
                            permission='cases.import_locations')
            return redirect('datasets:import_locations:state', task_id=task.id)
    else:
        form = UploadLocationsFileForm()
    return render(request, 'import_export/upload_locations.html', {'form': form})


@login_required()
@permission_required('cases.import_locations')
@require_http_methods(['GET'])
def upload_locations_state(request, task_id):
    try:
        status = get_task_status(task_id, user=request.user)
    except NoSuchJobError:
        message = default_messages['upload_expired']
        messages.add_message(request, messages.INFO, message)
        return redirect('datasets:import_locations:upload')

    if status != 'finished':
        return render(request, 'import_export/upload_state.html', {'status': status})
    return redirect('datasets:import_locations:done', task_id=task_id)


@login_required()
@permission_required('cases.import_locations')
@require_http_methods(['GET'])
def upload_locations_done(request, task_id):
    try:
        result = get_task_result(task_id, user=request.user)
    except NoSuchJobError:
        message = default_messages['upload_expired']
        messages.add_message(request, messages.INFO, message)
        return redirect('datasets:import_locations:upload')
    return render(request, 'import_export/upload_locations_done.html', {'result': result})
