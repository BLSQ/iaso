import json
from django.contrib import messages
from django.contrib.auth.decorators import login_required, permission_required
from django.core.urlresolvers import reverse
from django.http import FileResponse
from django.shortcuts import render, redirect
from django.utils.translation import ugettext as _
from django.views.decorators.http import require_http_methods
from pathlib import PurePath
from rq.exceptions import NoSuchJobError

from hat.common.utils import create_shared_filename
from hat.common.view_utils import task_status
from hat.rq.utils import run_task, get_task_result

from .forms import \
    UploadMdbFilesForm, UploadLocationsFileForm, UploadReconciledFileForm, DownloadCsvForm
from .tasks import \
    import_task, export_task, import_locations_task, \
    import_locations_areas_task, import_reconciled_task

upload_messages = {
    'title': _('Uploading data'),
    'running': _('The file upload is in progress...'),
    'expired': _("The upload job you\'re looking for has expired."),
    'failed': _("The upload job has failed."),
}

download_messages = {
    'title': _('Datasets – cases'),
    'running': _('Preparing download...'),
    'expired':  _("The download job you're looking for has expired. "
                  "You can create a new download with the button below."),
    'failed':  _("The download job has failed.  Please try again."),
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
    return render(request, 'import_export/upload_cases.html', {'form': form})


@login_required()
@permission_required('cases.import')
@require_http_methods(['GET'])
def upload_cases_state(request, task_id):
    return task_status(request, task_id=task_id,
                       back_view='datasets:import_cases:done',
                       texts=upload_messages
                       )


@login_required()
@permission_required('cases.import')
@require_http_methods(['GET'])
def upload_cases_done(request, task_id):
    return upload_done(request, task_id, 'datasets:import_cases:upload', _('cases'))


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
                'date_from': form.cleaned_data['date_from'],
                'date_to': form.cleaned_data['date_to'],
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
    return task_status(request, task_id=task_id,
                       back_view='datasets:export_cases:done',
                       texts=download_messages
                       )


@login_required()
@permission_required('cases.export')
@require_http_methods(['GET'])
def download_cases_done(request, task_id):
    url = reverse('datasets:export_cases:get', args=(task_id,))
    return render(request, 'import_export/download_done.html', {'download_link': url})


@login_required()
@permission_required('cases.export')
@require_http_methods(['GET'])
def download_cases_get(request, task_id):
    try:
        filename = get_task_result(task_id, user=request.user)
    except NoSuchJobError:
        messages.add_message(request, messages.ERROR, download_messages['expired'])
        return redirect('datasets:export_cases:download')

    response = FileResponse(open(filename, 'rb'))
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
            source = request.POST.get('source', None)
            form_files = request.FILES.getlist('file')
            file = form_files[0]
            suffix = PurePath(file.name).suffix.lower()
            filename = create_shared_filename(suffix)
            with open(filename, 'wb') as fd:
                fd.write(file.read())
            # run import task
            if source == 'areas':
                task = run_task(import_locations_areas_task, args=[file.name, filename],
                                permission='cases.import_locations')
            else:
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
    return task_status(request, task_id=task_id,
                       back_view='datasets:import_locations:done',
                       texts=upload_messages
                       )


@login_required()
@permission_required('cases.import_locations')
@require_http_methods(['GET'])
def upload_locations_done(request, task_id):
    return upload_done(request, task_id, 'datasets:import_locations:upload', _('locations'))


################################################################################
# Upload reconciled data
################################################################################


@login_required()
@permission_required('cases.import_reconciled')
@require_http_methods(['GET', 'POST'])
def upload_reconciled(request):
    if request.method == 'POST':
        form = UploadReconciledFileForm(request.POST, request.FILES)
        if form.is_valid():
            form_files = request.FILES.getlist('file')
            file = form_files[0]
            suffix = PurePath(file.name).suffix.lower()
            filename = create_shared_filename(suffix)
            with open(filename, 'wb') as fd:
                fd.write(file.read())
            # run import task
            task = run_task(import_reconciled_task, args=[file.name, filename],
                            permission='cases.import_reconciled')
            return redirect('datasets:import_reconciled:state', task_id=task.id)
    else:
        form = UploadReconciledFileForm()
    return render(request, 'import_export/upload_reconciled.html', {'form': form})


@login_required()
@permission_required('cases.import_reconciled')
@require_http_methods(['GET'])
def upload_reconciled_state(request, task_id):
    return task_status(request, task_id=task_id,
                       back_view='datasets:import_reconciled:done',
                       texts=upload_messages
                       )


@login_required()
@permission_required('cases.import_reconciled')
@require_http_methods(['GET'])
def upload_reconciled_done(request, task_id):
    return upload_done(request, task_id, 'datasets:import_reconciled:upload', _('reconciled data'))


################################################################################
# Upload helpers
################################################################################


def upload_done(request, task_id, error_view, dataset):
    try:
        results = get_task_result(task_id, user=request.user)
        if not isinstance(results, list):
            results = [results]
    except NoSuchJobError:
        messages.add_message(request, messages.ERROR, upload_messages['expired'])
        return redirect(error_view)

    for result in results:
        result['ok'] = result['error'] is None
    error_count = sum(1 for r in results if r['error'] is not None)
    resultJSON = json.dumps(results, indent=2)

    return render(request, 'import_export/upload_done.html', {
        'dataset': dataset,
        'results': results,
        'resultJSON': resultJSON,
        'error_count': error_count
    })
