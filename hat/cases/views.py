import logging
import uuid

from django.contrib.auth.decorators import login_required, permission_required
from django.db.models import Case
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.http.request import HttpRequest
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.http import require_http_methods

from hat.dashboard.views import get_menu
from hat.import_export.mapping import ANON_EXPORT_FIELDS, FULL_EXPORT_FIELDS
from hat.patient.models import Test, Patient
from .forms import CaseForm
from ..sync.models import ImageUpload, VideoUpload, DeviceDB

logger = logging.getLogger('views.py')


@login_required()
@permission_required('menupermissions.x_case_cases')
@require_http_methods(['GET'])
def cases_details(request: HttpRequest, doc_id: str = None) -> HttpResponse:
    back_link = request.GET.get('back', 'cases:cases_list')
    try:
        case = Case.objects.get(document_id=doc_id)
    except Case.DoesNotExist:
        case = Case.objects.get(pk=doc_id)

    case_tests = Test.objects.filter(form=case)
    patient = Patient.objects.filter(id=case.normalized_patient_id)
    device_details = None
    if case.device_id:
        try:
            device_details = DeviceDB.objects.get(device_id=case.device_id)
        except DeviceDB.DoesNotExist:
            pass

    images = ImageUpload.objects.filter(hat_id=case.hat_id).order_by("-upload_date")
    videos = VideoUpload.objects.filter(hat_id=case.hat_id).order_by("-upload_date")

    if request.user.has_perm('cases.view_full'):
        fields = sorted(FULL_EXPORT_FIELDS)
    else:
        fields = sorted(ANON_EXPORT_FIELDS)

    return render(request, 'cases/cases/detail.html', {
        'back_link': back_link,
        'case': case,
        'fields': fields,
        'images': images,
        'videos': videos,
        'tests': case_tests,
        'patient': patient,
        'device_details': device_details,
        'menu': get_menu(request.user, reverse("cases:cases_details", kwargs={'doc_id': doc_id}))
    })


################################################################################
# manual encoding form
################################################################################

def encoding(request: HttpRequest) -> HttpResponse:
    if request.POST:
        case_form = CaseForm(request.POST)
        if case_form.is_valid():
            case = case_form.save(commit=False)
            case.document_id = uuid.uuid4()
            case.save()
            return HttpResponseRedirect(reverse('cases:encoding'))
    else:
        case_form = CaseForm()
    return render(request, 'cases/encoding/case_encoding.html',
                  {"case_form": case_form})
