from django.db import transaction

from hat.audit.models import log_modification, PATIENT_API
from hat.cases.models import Case
from hat.patient.models import PatientIgnoredPair, PatientDuplicatesView, PatientDuplicatesPair


@transaction.atomic
def merge_patient_duplicate(patient_dupe, merge_from, merge_to, user):
    log_modification(patient_dupe, merge_to, PATIENT_API, user)
    Case.objects.filter(normalized_patient=merge_from).update(normalized_patient=merge_to)
    merge_from.delete()
    patient_dupe.delete()
    return merge_to


@transaction.atomic
def ignore_patient_duplicate(patient_dupe, user):
    ignored_pair, ignored_pair_created = PatientIgnoredPair.objects.get_or_create(
        patient1_id=patient_dupe.patient1_id,
        patient2_id=patient_dupe.patient2_id,
        defaults={'algorithm': patient_dupe.algorithm, 'ignored_by': user}
    )
    if ignored_pair:
        # Delete the pair from all algorithms
        PatientDuplicatesPair.objects\
            .filter(
                patient1_id=patient_dupe.patient1_id,
                patient2_id=patient_dupe.patient2_id)\
            .delete()
        return ignored_pair


def create_potential_duplicates_for_patient(patient):
    """
    This method will look for potential duplicates for a (new) patient and store them if appropriate
    """
    to_insert = []
    for dupe in PatientDuplicatesView.objects.filter(patient1_id=patient.id):
        to_insert.append(PatientDuplicatesPair(
            patient1_id=dupe.patient1_id,
            patient2_id=dupe.patient2_id,
            similarity_score=dupe.similarity_score,
            algorithm=dupe.algorithm,
        ))

    PatientDuplicatesPair.objects.bulk_create(to_insert)
    return len(to_insert)


def create_potential_duplicates_for_patient_range(low_id, high_id):
    """
    This method will look for potential duplicates for a range of patient ids and store them if appropriate
    """
    count=0
    for dupe in PatientDuplicatesView.objects.filter(patient1_id__gte=low_id, patient1_id__lt=high_id).filter(F()):
        if dupe.patient1_id > dupe.patient2_id:  # we will have 3,5 and 5,3. Only add 5,3.
            dupe, dupe_created = PatientDuplicatesPair.objects.update_or_create(
                patient1_id=dupe.patient1_id,
                patient2_id=dupe.patient2_id,
                similarity_score=dupe.similarity_score,
                algorithm=dupe.algorithm,
            )
            if dupe_created:
                count += 1
            else:
                print("Duplicate pair detected, ignoring", dupe)

    return count
