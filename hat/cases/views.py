from django.contrib import messages
from django.contrib.auth.decorators import login_required, permission_required
from django.db.models import Q, Count
from django.shortcuts import render, redirect
from django.urls import reverse
from django.utils.translation import ugettext as _
from django.views.decorators.http import require_http_methods

from hat.common.view_utils import paginate
from .duplicates import merge_cases, commit_merge, commit_ignore
from .filters import Q_is_suspect
from .forms import filter_and_create_form, FieldChoice, OrderChoice
from .models import Case, CaseView, DuplicatesPair


@login_required()
@permission_required('cases.reconcile_duplicates')
@require_http_methods(['GET'])
def duplicatespair_list(request):
    items = DuplicatesPair.objects.order_by('id')

    locations_filters = {
        'all': Case.objects.filter(
            Q(id__in=items.values_list('case1')) |
            Q(id__in=items.values_list('case2'))
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
            id='id', label=_('Internal ID'),
            filter=lambda q, v: q.filter(
                Q(case1__document_id__icontains=v) |
                Q(case2__document_id__icontains=v)
            )),
        FieldChoice(
            id='names', label=_('Name'),
            filter=lambda q, v: q.filter(
                Q(case1__name__icontains=v) |
                Q(case1__prename__icontains=v) |
                Q(case1__lastname__icontains=v) |
                Q(case2__name__icontains=v) |
                Q(case2__prename__icontains=v) |
                Q(case2__lastname__icontains=v)
            )),
    ]

    orders = (
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
    )

    data = filter_and_create_form(request,
                                  items=items,
                                  locations_filters=locations_filters,
                                  fields_filters=fields_filters,
                                  dates_filters=dates_filters,
                                  orders=orders,
                                  )
    current_page = paginate(request,
                            objects=data.items,
                            prefix_url=reverse('cases:duplicates_list') + '?',
                            page_size=10,
                            )

    return render(request, 'cases/duplicates/list.html', {
        'page': current_page,
        'form': data.form
    })


@login_required()
@permission_required('cases.reconcile_duplicates')
@require_http_methods(['GET', 'POST'])
def duplicatespair_detail(request, pair_id):
    back_link = request.GET.get('back', 'cases:duplicates_list')

    (older_case, younger_case, merged_case, steps) = merge_cases(pair_id)

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

    def xstr(s):
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
def duplicatespair_merge(request, pair_id):
    back_link = request.GET.get('back', 'cases:duplicates_list')

    commit_merge(pair_id)

    messages.add_message(request, messages.SUCCESS, _('Merge done.'))
    return redirect(back_link)


@login_required()
@permission_required('cases.reconcile_duplicates')
@require_http_methods(['POST'])
def duplicatespair_ignore(request, pair_id):
    back_link = request.GET.get('back', 'cases:duplicates_list')

    commit_ignore(pair_id)

    messages.add_message(request, messages.SUCCESS, _('Match ignored.'))
    return redirect(back_link)


@login_required()
@permission_required('cases.view_full')
@require_http_methods(['GET'])
def cases_details(request, doc_id=None):
    back_link = request.GET.get('back', 'cases:cases_list')
    case = Case.objects.get(document_id=doc_id)
    rows = []
    for f in Case._meta.get_fields():
        v = getattr(case, f.name)
        rows.append({'name': f.name, 'value': v if v is not None else ''})

    return render(request, 'cases/cases/detail.html', {
        'back_link': back_link,
        'case': case,
        'rows': rows,
    })


@login_required()
@permission_required('cases.view_full')
@require_http_methods(['GET'])
def cases_list(request):
    items = CaseView.objects.order_by('id')

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
            id='id', label=_('Internal ID'),
            filter=lambda q, v: q.filter(document_id__icontains=v)),
        FieldChoice(
            id='names', label=_('Name'),
            filter=lambda q, v: q.filter(
                Q(name__icontains=v) | Q(prename__icontains=v) | Q(lastname__icontains=v))),
        FieldChoice(
            id='screening', label=_('Screening result'),
            filter=lambda q, v: q.filter(
                screening_result=(v.lower() == 'true' or v.lower() == 't'))),
        FieldChoice(
            id='confirmation', label=_('Confirmation result'),
            filter=lambda q, v: q.filter(
                confirmation_result=(v.lower() == 'true' or v.lower() == 't'))),
        FieldChoice(
            id='source', label=_('Source'),
            filter=lambda q, v: q.filter(source__icontains=v)),
    ]

    orders = (
        OrderChoice(
            id='date', label=_('Document date'),
            asc=lambda q: q.order_by('document_date', 'ZS', 'AS', 'village'),
            desc=lambda q: q.order_by('-document_date', 'ZS', 'AS', 'village'),
        ),
        OrderChoice(
            id='location', label=_('Location'),
            asc=lambda q: q.order_by('ZS', 'AS', 'village', '-document_date'),
            desc=lambda q: q.order_by('-ZS', '-AS', '-village', '-document_date'),
        ),
        OrderChoice(
            id='name', label=_('Name'),
            asc=lambda q: q.order_by('name', 'prename', 'lastname', '-document_date'),
            desc=lambda q: q.order_by('-name', '-prename', '-lastname', '-document_date'),
        ),
    )

    data = filter_and_create_form(request,
                                  items=items,
                                  locations_filters=locations_filters,
                                  fields_filters=fields_filters,
                                  dates_filters=dates_filters,
                                  orders=orders,
                                  )
    current_page = paginate(request,
                            objects=data.items,
                            prefix_url=reverse('cases:cases_list') + '?',
                            )
    return render(request, 'cases/cases/list.html', {
        'page': current_page,
        'form': data.form
    })


@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def suspects_list(request):
    items = CaseView.objects.filter(Q_is_suspect)

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

    orders = (
        OrderChoice(
            id='date', label=_('Document date'),
            asc=lambda q: q.order_by('date_day', 'ZS', 'AS', 'village'),
            desc=lambda q: q.order_by('-date_day', 'ZS', 'AS', 'village'),
        ),
        OrderChoice(
            id='location', label=_('Location'),
            asc=lambda q: q.order_by('ZS', 'AS', 'village', '-date_day'),
            desc=lambda q: q.order_by('-ZS', '-AS', '-village', '-date_day'),
        ),
    )

    data = filter_and_create_form(request,
                                  items=items,
                                  locations_filters=locations_filters,
                                  fields_filters=None,
                                  dates_filters=dates_filters,
                                  orders=orders,
                                  )

    total_cases = data.items.count()

    items = data.items \
        .values('date_day', 'ZS', 'AS', 'village') \
        .annotate(cases=Count('document_id')) \
        .values('date_day', 'ZS', 'AS', 'village', 'cases')

    current_page = paginate(request,
                            objects=items,
                            prefix_url=reverse('cases:suspects_list') + '?',
                            )
    return render(request, 'cases/suspects/list.html', {
        'page': current_page,
        'form': data.form,
        'total_cases': total_cases,
    })
