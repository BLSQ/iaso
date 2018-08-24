from django.contrib.auth.decorators import login_required, permission_required
from django.shortcuts import render, redirect
from django.views.decorators.http import require_http_methods
from django.http.request import HttpRequest
from django.http import HttpResponse
from pathlib import PurePath

from hat.common.utils import create_shared_filename
from hat.tasks.utils import run_task
from hat.tasks.jobs import \
    import_task, \
    import_locations_task, \
    import_locations_areas_task, \
    import_reconciled_task
from .forms import UploadFileForm
from hat.dashboard.views import get_menu
from django.urls import reverse


@login_required()
@permission_required('menupermissions.x_datasets_datauploads')
@require_http_methods(['GET'])
def index(request: HttpRequest) -> HttpResponse:
    return render(request, 'import_export/datasets.html')


################################################################################
# Upload cases dataset
################################################################################


@login_required()
@permission_required('menupermissions.x_datasets_datauploads')
@require_http_methods(['GET', 'POST'])
def upload_cases(request: HttpRequest) -> HttpResponse:
    if request.method == 'POST':
        form = UploadFileForm(True, '.mdb,.accdb,.enc', request.POST, request.FILES)
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
        form = UploadFileForm(True, '.mdb,.accdb,.enc')
    return render(request, 'import_export/upload_cases.html', {'form': form, 'menu': get_menu(request.user, reverse("datasets:import_cases:upload"))})


################################################################################
# Upload locations data
################################################################################


@login_required()
@permission_required('menupermissions.x_datasets_villageuploads')
@require_http_methods(['GET', 'POST'])
def upload_locations(request: HttpRequest) -> HttpResponse:
    if request.method == 'POST':
        form = UploadFileForm(False, '.dbf', request.POST, request.FILES)
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
        form = UploadFileForm(False, '.dbf')
    return render(request, 'import_export/upload_locations.html', {'form': form,  'menu': get_menu(request.user, reverse("datasets:import_locations:upload"))})


################################################################################
# Upload reconciled data
################################################################################


@login_required()
@permission_required('menupermissions.x_datasets_villageuploads')
@require_http_methods(['GET', 'POST'])
def upload_reconciled(request: HttpRequest) -> HttpResponse:
    if request.method == 'POST':
        form = UploadFileForm(False, '.csv,.xlsx', request.POST, request.FILES)
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
        form = UploadFileForm(False, '.csv,.xlsx')
    return render(request, 'import_export/upload_reconciled.html', {'form': form})
