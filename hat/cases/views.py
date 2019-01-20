import logging
import uuid

from django.contrib.auth.decorators import login_required, permission_required
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.http.request import HttpRequest
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.http import require_http_methods

from hat.cases.models import Case
from hat.dashboard.views import get_menu
from hat.import_export.mapping import ANON_EXPORT_FIELDS, FULL_EXPORT_FIELDS
from hat.patient.models import Test, Patient
from .forms import CaseForm
from ..sync.models import ImageUpload, VideoUpload, DeviceDB
from hat.common.utils import ANONYMOUS_PLACEHOLDER

logger = logging.getLogger('views.py')

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
