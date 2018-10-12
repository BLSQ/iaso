import logging
from typing import Any
from django.contrib import messages
from django.contrib.auth.decorators import login_required, permission_required
from django.db.models import Q
from django.shortcuts import render, redirect
from django.urls import reverse
from django.utils.translation import ugettext as _
from django.views.decorators.http import require_http_methods
from django.http.request import HttpRequest
from django.http import HttpResponse
from django.http import HttpResponseRedirect
import uuid
from hat.common.paginator import paginate
from hat.import_export.mapping import ANON_EXPORT_FIELDS, FULL_EXPORT_FIELDS
from hat.patient.models import Test, Patient

from .duplicates import merge_cases_pair, commit_ignore
from .forms import filter_and_create_form, FieldChoice, OrderChoice, ColumnChoice, CaseForm
from .models import Case, DuplicatesPair
from ..sync.models import ImageUpload, VideoUpload, DeviceDB
from hat.dashboard.views import get_menu

logger = logging.getLogger('views.py')

@login_required()
@permission_required('menupermissions.x_case_reconciliation')
@require_http_methods(['GET'])
def duplicatespair_list(request: HttpRequest) -> HttpResponse:
    queryset = DuplicatesPair.objects.order_by('id')

    locations_filters = {
        'all': Case.objects.filter(
            Q(id__in=queryset.values_list('case1')) |
            Q(id__in=queryset.values_list('case2'))
        ),
        'ZS': lambda q, v: q.filter(Q(case1__ZS=v) | Q(case2__ZS=v)),
        'AS': lambda q, v: q.filter(Q(case1__AS=v) | Q(case2__AS=v)),
        'village': lambda q, v: q.filter(Q(case1__village=v) | Q(case2__village=v)),
    }

    dates_filters = {
        'between': lambda q, f, t: q.filter(
            Q(case1__document_date__range=(f, t)) |
            Q(case2__document_date__range=(f, t))),
        'from': lambda q, v: q.filter(
            Q(case1__document_date__gte=v) |
            Q(case2__document_date__gte=v)),
        'to': lambda q, v: q.filter(
            Q(case1__document_date__lt=v) |
            Q(case2__document_date__lt=v)),
    }

    fields_filters = [
        FieldChoice(
            id='document_id', label=_('Internal ID'), choices=None,
            filter=lambda q, v: q.filter(
                Q(case1__document_id__icontains=v) |
                Q(case2__document_id__icontains=v)
            )
        ),
        FieldChoice(
            id='full_name', label=_('Name'), choices=None,
            filter=lambda q, v: q.filter(
                Q(case1__name__icontains=v) |
                Q(case1__prename__icontains=v) |
                Q(case1__lastname__icontains=v) |
                Q(case2__name__icontains=v) |
                Q(case2__prename__icontains=v) |
                Q(case2__lastname__icontains=v)
            )
        ),
    ]

    orders = [
        OrderChoice(
            id='date', label=_('Document date'),
            asc=lambda q: q.order_by('case1__document_date', 'case2__document_date', ),
            desc=lambda q: q.order_by('-case1__document_date', '-case2__document_date', ),
        ),
        OrderChoice(
            id='location', label=_('Location'),
            asc=lambda q: q.order_by('case1__ZS', 'case1__AS', 'case1__village',
                                     'case2__ZS', 'case2__AS', 'case2__village',
                                     ),
            desc=lambda q: q.order_by('-case1__ZS', '-case1__AS', '-case1__village',
                                      '-case2__ZS', '-case2__AS', '-case2__village',
                                      ),
        ),
        OrderChoice(
            id='name', label=_('Name'),
            asc=lambda q: q.order_by('case1__name', 'case1__prename', 'case1__lastname',
                                     'case2__name', 'case2__prename', 'case2__lastname',
                                     ),
            desc=lambda q: q.order_by('-case1__name', '-case1__prename', '-case1__lastname',
                                      '-case2__name', '-case2__prename', '-case2__lastname',
                                      ),
        ),
    ]

    queryset, form = filter_and_create_form(request,
                                            queryset=queryset,
                                            locations_filters=locations_filters,
                                            fields_filters=fields_filters,
                                            dates_filters=dates_filters,
                                            orders=orders,
                                            columns=None,
                                            )
    current_page = paginate(request,
                            objects=queryset,
                            prefix_url=reverse('cases:duplicates_list') + '?',
                            page_size=10,
                            )

    return render(request, 'cases/duplicates/list.html', {
        'page': current_page,
        'custom_filters': [f.id for f in fields_filters],
        'form': form,
        'menu': get_menu(request.user, reverse("cases:duplicates_list"))
    })


@login_required()
@permission_required('menupermissions.x_case_reconciliation')
@require_http_methods(['GET', 'POST'])
def duplicatespair_detail(request: HttpRequest, pair_id: str) -> HttpResponse:
    back_link = request.GET.get('back', 'cases:duplicates_list')

    (older_case, younger_case, merged_case, steps) = merge_cases_pair(pair_id)

    fields = [
        'source',
        'document_date',
        'name',
        'prename',
        'lastname',
        'sex',
        'approx_age',
        'mothers_surname',
        'village',
        'test_rdt',
        'test_catt',
        'test_maect',
        'test_ge',
        'test_pg',
        'test_ctcwoo',
        'test_pl_result'
    ]

    def xstr(s: Any) -> str:
        return str(s) if s is not None else ''

    rows = []
    for (field, winning_case, winner) in steps:
        if field not in fields:
            continue
        v1 = xstr(getattr(older_case, field))
        v2 = xstr(getattr(younger_case, field))
        v3 = xstr(getattr(winning_case, field))
        if winner == 1:
            (i1, i2) = ('+', '-')
        elif winner == 2:
            (i1, i2) = ('-', '+')
        else:
            (i1, i2) = ('', '')
        rows.append([
            field,
            {'value': v1, 'indicator': i1},
            {'value': v2, 'indicator': i2},
            {'value': v3, 'indicator': ''}
        ])

    return render(request, 'cases/duplicates/detail.html', {
        'pair_id': pair_id,
        'headers': ['Case 1', 'Case 2', 'Merged case preview'],
        'rows': rows,
        'back_link': back_link,
        'menu': get_menu(request.user, reverse("cases:duplicates_list"))
    })


@login_required()
@permission_required('menupermissions.x_case_reconciliation')
@require_http_methods(['POST'])
def duplicatespair_merge(request: HttpRequest, pair_id: str) -> HttpResponse:
    back_link = request.GET.get('back', 'cases:duplicates_list')

    #commit_merge(pair_id)
    #messages.add_message(request, messages.SUCCESS, _('Merge done.'))
    
    return redirect(back_link)


@login_required()
@permission_required('menupermissions.x_case_reconciliation')
@require_http_methods(['POST'])
def duplicatespair_ignore(request: HttpRequest, pair_id: str) -> HttpResponse:
    back_link = request.GET.get('back', 'cases:duplicates_list')

    commit_ignore(pair_id)

    messages.add_message(request, messages.SUCCESS, _('Match ignored.'))
    return redirect(back_link)


@login_required()
@permission_required('menupermissions.x_case_cases')
@require_http_methods(['GET'])
def cases_details(request: HttpRequest, doc_id: str=None) -> HttpResponse:
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
                  { "case_form": case_form})
