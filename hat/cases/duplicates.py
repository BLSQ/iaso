from django.db import transaction
from django.db.models import Q

from hat.cases.models import Case, DuplicatesPair, IgnoredPair
from .event_log import log_cases_merge


@transaction.atomic
def commit_ignore(pair_id):
    pair = DuplicatesPair.objects.get(pk=int(pair_id))
    IgnoredPair(document_id1=pair.document_id1, document_id2=pair.document_id2).save()
    pair.delete()


@transaction.atomic
def commit_merge(pair_id):
    (older_case, younger_case, merged_case, steps) = merge_cases_pair(pair_id)

    # delete pair
    DuplicatesPair.objects.get(pk=int(pair_id)).delete()

    # Update the current list of pairs where pairs exist that have younger_case id
    # in either place 1 or 2. We will update these occurences with the merged_case/older_case id
    # and if this results in pairs with repeated combination, we'll delete them in the process.
    younger_pairs = DuplicatesPair.objects.filter(
        Q(case1_id=younger_case.id) | Q(case2_id=younger_case.id)
    )
    merged_pairs_ids = DuplicatesPair.objects.filter(
        Q(case1_id=merged_case.id) | Q(case2_id=merged_case.id)
    ).values_list('case1_id', 'case2_id')

    for p in younger_pairs:
        # Find out the "other" case.
        if p.case1_id == younger_case.id:
            # 1st position is the younger id, take the other
            other_case_id = p.case2_id
            other_case_document_id = p.document_id2
        else:
            # 2nd position is the younger id, take the other
            other_case_id = p.case1_id
            other_case_document_id = p.document_id1

        # The model has a constraint that id1 > id2 to help finding duplicates.
        # We need to honor that.
        if other_case_id > merged_case.id:
            p.case1_id = other_case_id
            p.document_id1 = other_case_document_id
            p.document_id2 = merged_case.document_id
            p.case2_id = merged_case.id
        else:
            p.case1_id = merged_case.id
            p.document_id1 = merged_case.document_id
            p.case2_id = other_case_id
            p.document_id2 = other_case_document_id

        key = (p.case1_id, p.case2_id)
        if key in merged_pairs_ids:
            p.delete()
        else:
            p.save()

    # save merged with changes, it's the updated older one
    merged_case.save()
    # and delete the youngest one.
    younger_case.delete()

    # create the entry in the log
    log_cases_merge(older_case.document_id, younger_case.document_id)


def merge_cases_pair(pair_id):
    pair = DuplicatesPair.objects.get(pk=int(pair_id))

    # Get cases in chronological asc order
    [
        older_case,
        younger_case
    ] = Case.objects.filter(id__in=[pair.case1_id, pair.case2_id]) \
                    .order_by('document_date')

    return merge_case_models(older_case, younger_case)


def merge_cases_by_ids(updated_doc_id, deleted_doc_id):
    older_case = Case.objects.get(document_id=updated_doc_id)
    younger_case = Case.objects.get(document_id=deleted_doc_id)
    (_, _, merged_case, _) = merge_case_models(older_case, younger_case)
    # save merged with changes, it's the updated older case
    merged_case.save()
    # and delete the younger one.
    younger_case.delete()


def merge_case_models(older_case, younger_case):
    '''
    Merge two case models by merging the younger cases values into the older one.
    The returned case model has the same id as the older case model and saving the
    merged case model will update the older case. Should be deleted.
    '''
    steps = []

    # Merge the cases while prefering more recent values
    for field in older_case._meta.get_fields():
        # ids belong to the older case (merge into it)
        if field.name in ['id', 'document_id', 'hat_id']:
            steps.append((field.name, older_case, 1))
            continue

        v1 = getattr(older_case, field.name)
        v2 = getattr(younger_case, field.name)
        if v2 == v1:
            steps.append((field.name, older_case, 0))
        elif v2 is not None:
            steps.append((field.name, younger_case, 2))
        elif v1 is not None:
            steps.append((field.name, older_case, 1))

    merged_case = Case(**{name: getattr(case, name) for (name, case, _) in steps})
    return (older_case, younger_case, merged_case, steps)
