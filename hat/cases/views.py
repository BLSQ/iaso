from django import forms
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q
from django.shortcuts import render, redirect
from django.urls import reverse
from django.utils.translation import ugettext as _
from django.views.decorators.http import require_http_methods

from hat.cases.duplicates import merge_cases, commit_merge, commit_ignore
from hat.cases.models import Case, CaseView, DuplicatesPair


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def duplicatespair_list(request):
    all_pairs = DuplicatesPair.objects.order_by('case1__ZS', 'case1__AS', 'case1__village')
    paginator = Paginator(all_pairs, 25)

    page = request.GET.get('page')
    try:
        pairs = paginator.page(page)
    except PageNotAnInteger:
        # If page is not an integer, deliver first page.
        pairs = paginator.page(1)
    except EmptyPage:
        # If page is out of range (e.g. 9999), deliver last page of results.
        pairs = paginator.page(paginator.num_pages)

    rows = []
    if len(pairs) > 0:
        cur_loc = [pairs[0].case1.ZS, pairs[0].case1.AS, pairs[0].case1.village]
        rows = [{'type': 'location', 'location': ', '.join(cur_loc)}]
        for pair in pairs:
            loc = [pair.case1.ZS, pair.case1.AS, pair.case1.village]
            if loc != cur_loc:
                cur_loc = loc
                rows.append({'type': 'location', 'location': ', '.join(cur_loc)})
            rows.append({'type': 'pair', 'pair': pair})

    return render(request, 'cases/duplicates_list.html', {
        'count': all_pairs.count(),
        'rows': rows,
        'pairs': pairs
    })


@login_required()
@user_passes_test(lambda u: u.is_superuser)
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

    return render(request, 'cases/duplicates_detail.html', {
        'pair_id': pair_id,
        'headers': ['Case 1', 'Case 2', 'Merged case preview'],
        'rows': rows,
        'back_link': back_link
    })


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def duplicatespair_merge(request, pair_id):
    back_link = request.GET.get('back', 'cases:duplicates_list')

    commit_merge(pair_id)

    messages.add_message(request, messages.SUCCESS, _('Merge done.'))
    return redirect(back_link)


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['POST'])
def duplicatespair_ignore(request, pair_id):
    back_link = request.GET.get('back', 'cases:duplicates_list')

    commit_ignore(pair_id)

    messages.add_message(request, messages.SUCCESS, _('Match ignored.'))
    return redirect(back_link)


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def cases_details(request, doc_id=None):
    back_link = request.GET.get('back', 'cases:cases_list')
    case = Case.objects.get(document_id=doc_id)
    rows = []
    for f in Case._meta.get_fields():
        v = getattr(case, f.name)
        rows.append({'name': f.name, 'value': v if v is not None else ''})

    return render(request, 'cases/cases_detail.html', {
        'back_link': back_link,
        'case': case,
        'rows': rows,
    })


@login_required()
@user_passes_test(lambda u: u.is_superuser)
@require_http_methods(['GET'])
def cases_list(request):
    all_cases = CaseView.objects.all()

    locations = [Case.objects.order_by('ZS').values_list('ZS', flat=True).distinct()]
    location = []

    ZS = request.GET.get('ZS', None)
    if ZS is not None and ZS is not '':
        all_cases = all_cases.filter(ZS=ZS)
        location.append(ZS)
        ASs = Case.objects \
                  .filter(ZS=ZS) \
                  .order_by('AS') \
                  .values_list('AS', flat=True) \
                  .distinct()
        locations.append(ASs)

        AS = request.GET.get('AS', None)
        if AS is not None and AS is not '' and AS in ASs:
            all_cases = all_cases.filter(AS=AS)
            location.append(AS)
            villages = Case.objects \
                           .filter(ZS=ZS, AS=AS) \
                           .order_by('village') \
                           .values_list('village', flat=True) \
                           .distinct()
            locations.append(villages)

            village = request.GET.get('village', None)
            if village is not None and village is not '' and village in villages:
                all_cases = all_cases.filter(village=village)
                location.append(village)

    fields = [
        ('document_id', lambda q, v: q.filter(document_id__icontains=v)),
        ('names', lambda q, v: q.filter(
            Q(name__icontains=v) | Q(prename__icontains=v) | Q(lastname__icontains=v))),
        ('screening_result', lambda q, v: q.filter(
            screening_result=v.lower() == 'true' or v.lower() == 't')),
        ('confirmation_result', lambda q, v: q.filter(
            confirmation_result=v.lower() == 'true' or v.lower() == 't'))
    ]

    case_fields = [name for (name, _) in fields]
    case_field = request.GET.get('case_field', None)
    if case_field is not None and case_field is not '':
        case_field_value = request.GET.get('case_field_value', None)
        if case_field_value is not None and case_field_value is not '':
            f = next(f[1] for f in fields if f[0] == case_field)
            all_cases = f(all_cases, case_field_value)
    else:
        case_field = None

    case_orders = (
        ('date', _('Document date')),
        ('location', _('Location')),
        ('names', _('Name'))
    )
    case_order = request.GET.get('case_order', None)
    if case_order == 'date':
        all_cases = all_cases.order_by('-document_date', 'ZS', 'AS', 'village')
    elif case_order == 'location':
        all_cases = all_cases.order_by('ZS', 'AS', 'village', '-document_date')
    elif case_order == 'names':
        all_cases = all_cases.order_by('name', 'prename', 'lastname', '-document_date')
    else:
        all_cases = all_cases.order_by('id')

    form = CasesFilterForm(locations, location,
                           case_fields, case_field,
                           case_orders, case_order,
                           request.GET or None)
    paginator = Paginator(all_cases, 25)

    page = request.GET.get('page')
    try:
        cases = paginator.page(page)
    except PageNotAnInteger:
        # If page is not an integer, deliver first page.
        cases = paginator.page(1)
    except EmptyPage:
        # If page is out of range (e.g. 9999), deliver last page of results.
        cases = paginator.page(paginator.num_pages)

    next_url = None
    prev_url = None

    if cases.has_next():
        qs = request.GET.copy()
        qs['page'] = cases.next_page_number()
        next_url = reverse('cases:cases_list') + '?' + qs.urlencode()
    if cases.has_previous():
        qs = request.GET.copy()
        qs['page'] = cases.previous_page_number()
        prev_url = reverse('cases:cases_list') + '?' + qs.urlencode()

    return render(request, 'cases/cases_list.html', {
        'cases': cases,
        'count': all_cases.count(),
        'form': form,
        'next_url': next_url,
        'prev_url': prev_url
    })


class CasesFilterForm(forms.Form):
    def __init__(self, locations, location, fields, case_field, orders, order, *args, **kwargs):
        super(CasesFilterForm, self).__init__(*args, **kwargs)

        location_attrs = {
            'class': 'select--minimised',
            'onchange': 'casesfilter.submit();',
        }

        zs_widget = forms.Select(attrs=location_attrs)
        zs_choices = [(None, _('None'))] + [(l, l) for l in locations[0]]

        if len(locations) > 1:
            as_widget = forms.Select(attrs=location_attrs)
            as_choices = [(None, _('None'))] + [(l, l) for l in locations[1]]
        else:
            as_widget = forms.HiddenInput()
            as_choices = []

        if len(locations) > 2:
            village_widget = forms.Select(attrs=location_attrs)
            village_choices = [(None, _('None'))] + [(l, l) for l in locations[2]]
        else:
            village_widget = forms.HiddenInput()
            village_choices = []

        self.fields['ZS'] = forms.ChoiceField(
            choices=zs_choices,
            widget=zs_widget,
            required=False
        )
        self.fields['AS'] = forms.ChoiceField(
            choices=as_choices,
            widget=as_widget,
            required=False
        )
        self.fields['village'] = forms.ChoiceField(
            choices=village_choices,
            widget=village_widget,
            required=False
        )

        self.fields['case_field'] = forms.ChoiceField(
            choices=[(None, _('None'))] + [(f, _(f)) for f in fields],
            widget=forms.Select(attrs={
                'class': 'select--minimised',
                'onchange': 'casesfilter.submit();',
            }),
            required=False
        )
        if case_field:
            case_field_value_widget = forms.TextInput(attrs={'class': 'input--minimised'})
        else:
            case_field_value_widget = forms.HiddenInput()
        self.fields['case_field_value'] = forms.CharField(
            widget=case_field_value_widget,
            required=False
        )

        self.fields['case_order'] = forms.ChoiceField(
            choices=[(None, _('None'))] + [o for o in orders],
            widget=forms.Select(attrs={
                'class': 'select--minimised',
                'onchange': 'casesfilter.submit();',
            }),
            required=False
        )
