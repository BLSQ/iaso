from typing import List, Tuple, Any
from django.contrib import messages
from django.contrib.auth.decorators import login_required, permission_required
from django.db.models import F, Q, Min, Max, Count, Case as QCase, When
from django.db.models.query import QuerySet
from django.shortcuts import render, redirect
from django.urls import reverse
from django.utils.translation import ugettext as _
from django.views.decorators.http import require_http_methods
from django.http.request import HttpRequest
from django.http import HttpResponseForbidden, HttpResponse

from hat.common.paginator import paginate
from hat.import_export.mapping import ANON_EXPORT_FIELDS, FULL_EXPORT_FIELDS

from .duplicates import merge_cases_pair, commit_merge, commit_ignore
from .filters import Q_is_suspect, Q_screening_positive, Q_confirmation_positive
from .forms import filter_and_create_form, FieldChoice, OrderChoice, ColumnChoice
from .models import Case, CaseView, DuplicatesPair


@login_required()
@permission_required('cases.reconcile_duplicates')
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
    })


@login_required()
@permission_required('cases.reconcile_duplicates')
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
        'age',
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
        'back_link': back_link
    })


@login_required()
@permission_required('cases.reconcile_duplicates')
@require_http_methods(['POST'])
def duplicatespair_merge(request: HttpRequest, pair_id: str) -> HttpResponse:
    back_link = request.GET.get('back', 'cases:duplicates_list')

    commit_merge(pair_id)

    messages.add_message(request, messages.SUCCESS, _('Merge done.'))
    return redirect(back_link)


@login_required()
@permission_required('cases.reconcile_duplicates')
@require_http_methods(['POST'])
def duplicatespair_ignore(request: HttpRequest, pair_id: str) -> HttpResponse:
    back_link = request.GET.get('back', 'cases:duplicates_list')

    commit_ignore(pair_id)

    messages.add_message(request, messages.SUCCESS, _('Match ignored.'))
    return redirect(back_link)


@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def cases_details(request: HttpRequest, doc_id: str=None) -> HttpResponse:
    back_link = request.GET.get('back', 'cases:cases_list')
    case = Case.objects.get(document_id=doc_id)
    if request.user.has_perm('cases.view_full'):
        fields = sorted(FULL_EXPORT_FIELDS)
    else:
        fields = sorted(ANON_EXPORT_FIELDS)

    return render(request, 'cases/cases/detail.html', {
        'back_link': back_link,
        'case': case,
        'fields': fields,
    })


@login_required()
@permission_required('cases.view')
@require_http_methods(['GET', 'POST'])
def cases_list(request: HttpRequest) -> HttpResponse:
    queryset = CaseView.objects.order_by('id')

    full_access = request.user.has_perm('cases.view_full')

    locations_filters = {
        'ZS': lambda q, v: q.filter(ZS=v),
        'AS': lambda q, v: q.filter(AS=v),
        'village': lambda q, v: q.filter(village=v),
    }

    dates_filters = {
        'between': lambda q, f, t: q.filter(Q(document_date__range=(f, t))),
        'from': lambda q, v: q.filter(Q(document_date__gte=v)),
        'to': lambda q, v: q.filter(Q(document_date__lt=v)),
    }

    fields_filters = [
        FieldChoice(
            id='document_id', label=_('Internal ID'), choices=None,
            filter=lambda q, v: q.filter(document_id__icontains=v)
        ),
    ]

    if full_access:
        fields_filters = fields_filters + [
            FieldChoice(
                id='full_name', label=_('Name'), choices=None,
                filter=lambda q, v: q.filter(full_name__icontains=v)
            ),
        ]

    fields_filters = fields_filters + [
        FieldChoice(
            id='suspect', label=_('Suspect case'),
            choices=yesno_choices,
            filter=lambda q, v: q.filter(check_boolean(Q_is_suspect, v))
        ),
        FieldChoice(
            id='screening', label=_('Screening result'),
            choices=positive_choices,
            filter=lambda q, v: q.filter(check_boolean(Q_screening_positive, v))
        ),
        FieldChoice(
            id='confirmation', label=_('Confirmation result'),
            choices=positive_choices,
            filter=lambda q, v: q.filter(check_boolean(Q_confirmation_positive, v))
        ),
        FieldChoice(
            id='source', label=_('Source'),
            filter=lambda q, v: q.filter(source=v),
            choices=get_sources_choices(),
        ),
        FieldChoice(
            id='device_id', label=_('Device'),
            filter=lambda q, v: q.filter(device_id=v),
            choices=get_devices_choices(),
        ),
    ]

    orders = [
        OrderChoice(
            id='date', label=_('Document date'),
            asc=lambda q: q.order_by('document_date', 'ZS', 'AS', 'village'),
            desc=lambda q: q.order_by('-document_date', 'ZS', 'AS', 'village'),
        ),
        OrderChoice(
            id='location', label=_('Location'),
            asc=lambda q: q.order_by('full_location', '-document_date'),
            desc=lambda q: q.order_by('-full_location', '-document_date'),
        ),
    ]

    if full_access:
        orders = orders + [
            OrderChoice(
                id='name', label=_('Name'),
                asc=lambda q: q.order_by('full_name', '-document_date'),
                desc=lambda q: q.order_by('-full_name', '-document_date'),
            ),
        ]

    if full_access:
        columns = [
            ColumnChoice(id='full_name', label=_('Name')),
            ColumnChoice(id='sex', label=_('Gender')),
            ColumnChoice(id='age', label=_('Age')),
        ]
    else:
        columns = []

    queryset, form = filter_and_create_form(request,
                                            queryset=queryset,
                                            locations_filters=locations_filters,
                                            fields_filters=fields_filters,
                                            dates_filters=dates_filters,
                                            orders=orders,
                                            columns=None,
                                            )

    task = None
    if request.method == 'POST':
        task = run_download_task(request, queryset)
    if task:
        return task

    current_page = paginate(request,
                            objects=queryset,
                            prefix_url=reverse('cases:cases_list') + '?',
                            )
    download_link = get_download_link(request)

    return render(request, 'cases/cases/list.html', {
        'page': current_page,
        'custom_filters': [f.id for f in fields_filters],
        'columns': columns,
        'form': form,
        'download_link': download_link,
    })


@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def analysis(request: HttpRequest) -> HttpResponse:
    queryset = CaseView.objects

    locations_filters = {
        'ZS': lambda q, v: q.filter(ZS=v),
        'AS': lambda q, v: q.filter(AS=v),
        'village': lambda q, v: q.filter(village=v),
    }

    dates_filters = {
        'between': lambda q, f, t: q.filter(Q(document_date__range=(f, t))),
        'from': lambda q, v: q.filter(Q(document_date__gte=v)),
        'to': lambda q, v: q.filter(Q(document_date__lt=v)),
    }

    fields_filters = [
        FieldChoice(
            id='source', label=_('Source'),
            filter=lambda q, v: q.filter(source=v),
            choices=get_sources_choices(),
        ),
        FieldChoice(
            id='device_id', label=_('Device'),
            filter=lambda q, v: q.filter(device_id=v),
            choices=get_devices_choices(),
        ),
    ]

    columns = [
        ColumnChoice(id='document_year', label=_('Year')),
        ColumnChoice(id='document_month', label=_('Month')),
        ColumnChoice(id='document_day', label=_('Day')),
        ColumnChoice(id='ZS', label=_('Zone de Sante')),
        ColumnChoice(id='AS', label=_('Aire de Sante')),
        ColumnChoice(id='village', label=_('Village')),
        ColumnChoice(id='source', label=_('Source')),
        ColumnChoice(id='device_id', label=_('Device')),
    ]

    queryset, form = filter_and_create_form(request,
                                            queryset=queryset,
                                            locations_filters=locations_filters,
                                            fields_filters=fields_filters,
                                            dates_filters=dates_filters,
                                            columns=columns,
                                            )

    total_participants = count(queryset, Q_all, 'document_id')
    total_suspect = count(queryset, Q_suspect, 'document_id')
    total_confirmed = count(queryset, Q_confirmed, 'document_id')

    ############################################################################
    # analysis columns
    analysisColumns = [
        ColumnChoice(id='date_from', label=_('From')),
        ColumnChoice(id='date_to', label=_('To')),
        ColumnChoice(id='participants', label=_('# Participants')),
        ColumnChoice(id='suspected', label=_('# Suspected cases')),
        ColumnChoice(id='confirmed', label=_('# Confirmed cases')),
    ]

    analysisData = {
        'participants': Count(calculated(Q_all, 'document_id')),
        'suspected': Count(calculated(Q_suspect, 'document_id')),
        'confirmed': Count(calculated(Q_confirmed, 'document_id')),
        'date_from': Min('document_date'),
        'date_to': Max('document_date'),
    }

    ############################################################################
    # check columns
    fields = request.GET.getlist('columns')
    if fields:
        columns_in_page = [column for column in columns if column.id in fields]
        queryset = queryset.order_by(*fields).values(*fields) \
            .annotate(**analysisData) \
            .values(*fields, *[c.id for c in analysisColumns])
        current_page = paginate(request,
                                objects=queryset,
                                prefix_url=reverse('cases:analysis') + '?',
                                )
    else:
        columns_in_page = []
        item = queryset.aggregate(**analysisData)
        current_page = {'items': [item], 'count': 1}

    columns_in_page = columns_in_page + analysisColumns

    return render(request, 'cases/analysis/list.html', {
        'page': current_page,
        'form': form,
        'custom_filters': [f.id for f in fields_filters],
        'columns': columns_in_page,
        'total_participants': total_participants,
        'total_suspect': total_suspect,
        'total_confirmed': total_confirmed,
    })


################################################################################
# Download cases
################################################################################

download_messages = {
    'title': _('Cases'),
    'heading': _('Download cases'),
    'inprogress': _('Preparing download...'),
    'expired':  _('The download job you\'re looking for has expired.'),
    'failed':  _('The download job has failed. Please try again.'),
}


def run_download_task(request: HttpRequest, queryset: QuerySet) -> HttpResponse:
    from hat.tasks.utils import run_task
    from hat.tasks.jobs import export_task

    if request.user.has_perm('cases.export_full'):
        fields = FULL_EXPORT_FIELDS
        permission = 'cases.export_full'
    elif request.user.has_perm('cases.export'):
        fields = ANON_EXPORT_FIELDS
        permission = 'cases.export'
    else:
        raise HttpResponseForbidden()

    task = run_task(export_task,
                    kwargs={'queryset': queryset.values(*fields)},
                    permission=permission
                    )

    url = reverse('cases:download_state', kwargs={'task_id': task.id})
    return redirect(url + '?{}'.format(request.GET.urlencode()))


@login_required()
@require_http_methods(['GET'])
def download_state(request: HttpRequest, task_id: str) -> HttpResponse:
    from hat.tasks.views import task_state
    return task_state(request,
                      task_id=task_id,
                      next_view='cases:download_done',
                      expired_view='cases:download_failed',
                      error_view='cases:download_failed',
                      texts=download_messages,
                      )


@login_required()
@require_http_methods(['GET'])
def download_done(request: HttpRequest, task_id: str) -> HttpResponse:
    url = reverse('cases:cases_list')
    return redirect(url + '?task_id={}&{}'.format(task_id, request.GET.urlencode()))


@login_required()
@require_http_methods(['GET'])
def download_failed(request: HttpRequest, task_id: str) -> HttpResponse:
    url = reverse('cases:cases_list')
    return redirect(url + '?{}'.format(request.GET.urlencode()))


@login_required()
@require_http_methods(['GET'])
def download_get(request: HttpRequest, task_id: str) -> HttpResponse:
    from hat.tasks.views import download_get
    return download_get(request,
                        task_id=task_id,
                        filename='hat_cases.csv',
                        error_view='cases:download_failed',
                        )


def get_download_link(request: HttpRequest) -> HttpResponse:
    task_id = request.GET.get('task_id', None)
    if task_id:
        return reverse('cases:download_get', kwargs={'task_id': task_id})
    return None


################################################################################
# helpers
################################################################################

yesno_choices = [('false', _('No')), ('true', _('Yes')), ]
positive_choices = [('false', _('Negative')), ('true', _('Positive')), ]

Q_all = Q(document_id__isnull=False)
Q_suspect = Q_is_suspect
Q_confirmed = Q_confirmation_positive


def count(items: QuerySet, condition: Q, name: str) -> QuerySet:
    return items.filter(condition).values_list(name).distinct().count()


def calculated(condition: Q, name: str) -> QuerySet:
    return QCase(When(condition, then=F(name)))


def check_boolean(condition: Q, value: str) -> QuerySet:
    return condition if value == 'true' else ~condition


def get_sources_choices() -> List[Tuple[str, str]]:
    return [(c, c) for c in CaseView.objects.values_list('source', flat=True).distinct()]


def get_devices_choices() -> List[Tuple[str, str]]:
    return [(c, c) for c in CaseView.objects.values_list('device_id', flat=True).distinct()]
