from django.contrib import messages
from django.utils.translation import ugettext as _
from django.db import transaction
from django.db.models import Q
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, permission_required
from django.views.decorators.http import require_http_methods
from hat.cases.models import Case, DuplicatesPair, IgnoredPair


@login_required()
@permission_required('cases.reconcile_duplicates')
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
@permission_required('cases.reconcile_duplicates')
@require_http_methods(['GET', 'POST'])
def duplicatespair_detail(request, pair_id):
    back_link = request.GET.get('back', 'cases:duplicates_list')

    pair = DuplicatesPair.objects.get(pk=int(pair_id))
    # Get cases in chronological asc order
    [case1, case2] = Case.objects.filter(id__in=[pair.case1_id, pair.case2_id]) \
                                 .order_by('document_date')
    (new_case, steps) = merge_cases(case1, case2)

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
        v1 = xstr(getattr(case1, field))
        v2 = xstr(getattr(case2, field))
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
        'pair_id': pair.id,
        'headers': ['Case 1', 'Case 2', 'Merged case preview'],
        'rows': rows,
        'back_link': back_link
    })


@login_required()
@permission_required('cases.reconcile_duplicates')
@require_http_methods(['POST'])
@transaction.non_atomic_requests
def duplicatespair_merge(request, pair_id):
    back_link = request.GET.get('back', 'cases:duplicates_list')
    pair = DuplicatesPair.objects.get(pk=int(pair_id))
    # Get cases in chronological asc order
    [case1, case2] = Case.objects.filter(id__in=[pair.case1_id, pair.case2_id]) \
                                 .order_by('document_date')
    (new_case, steps) = merge_cases(case1, case2)

    pair.delete()
    commit_merge(case1, case2, new_case)
    # todo: persist the `steps` to the DB
    messages.add_message(request, messages.SUCCESS, _('Merge done.'))
    return redirect(back_link)


@login_required()
@permission_required('cases.reconcile_duplicates')
@require_http_methods(['POST'])
@transaction.non_atomic_requests
def duplicatespair_ignore(request, pair_id):
    back_link = request.GET.get('back', 'cases:duplicates_list')

    pair = DuplicatesPair.objects.get(pk=int(pair_id))
    pair.delete()

    ignored = IgnoredPair(document_id1=pair.document_id1, document_id2=pair.document_id2)
    ignored.save()

    messages.add_message(request, messages.SUCCESS, _('Match ignored.'))
    return redirect(back_link)


def merge_cases(case1, case2):
    # order by asc date
    if case1.document_date > case2.document_date:
        (case1, case2) = (case2, case1)

    steps = []

    # Merge the cases while prefering more recent values
    for field in case1._meta.get_fields():
        # ignore some fields
        if field.name in ['id', 'deleted']:
            continue
        v1 = getattr(case1, field.name)
        v2 = getattr(case2, field.name)
        if v2 == v1:
            steps.append((field.name, case2, 0))
        elif v2 is not None:
            steps.append((field.name, case2, 2))
        elif v1 is not None:
            steps.append((field.name, case1, 1))

    new_case = Case(**{name: getattr(case, name) for (name, case, _) in steps})
    return (new_case, steps)


def commit_merge(case1, case2, new_case):
    # Mark the cases as deleted. We will create a new merged case for them
    case1.deleted = True
    case1.save()
    case2.deleted = True
    case2.save()

    new_case.save()

    # Update the current list of pairs where pairs exist that have one of the
    # merged ids in either place 1 or 2. We will update the occurences of the
    # old ids with the new id and if this results in new pairs with the same
    # ids combination, we'll delete them in the process.
    existing_pairs = DuplicatesPair.objects.filter(
        (Q(case1_id=case1.id) | Q(case1_id=case2.id) |
         Q(case2_id=case1.id) | Q(case2_id=case2.id))
    )
    # Keep track of pairs that have the same id combination
    unique_pairs = set()
    for p in existing_pairs:
        # Replace the merged ids with the new id. The model has a constraint
        # that id1 > id2 to help finding duplicates. We need to honor that.
        # The new id will always be greater than any existing id. Any arising
        # duplicate pairs will be deleted.

        if p.case1_id == case1.id or p.case1_id == case2.id:
            key = (new_case.id, p.case2_id)
            if key in unique_pairs:
                p.delete()
            else:
                p.case1_id = new_case.id
                p.save()
        elif p.case2_id == case1.id or p.case2_id == case2.id:
            key = (new_case.id, p.case1_id)
            if key in unique_pairs:
                p.delete()
            else:
                # ids need to be switched to keep up with the constraint
                p.case2_id = p.case1_id
                p.case1_id = new_case.id
                p.save()

        unique_pairs.add(key)
