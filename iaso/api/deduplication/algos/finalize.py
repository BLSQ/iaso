from itertools import islice
from typing import List

from django.utils.timezone import now

from iaso.api.deduplication.common import PotentialDuplicate
from iaso.models import EntityDuplicate
from iaso.models.base import Task


def finalize_from_task(the_task: Task, potential_duplicates: List[PotentialDuplicate]):
    eda = the_task.entity_duplicate_analyzis.first()

    if not eda:
        raise Exception("No entity duplicate analyze found for task %s" % the_task)

    batch_size = 100

    entity_duplicates = (
        EntityDuplicate(
            entity1_id=int(pot_dup["entity1_id"]),
            entity2_id=int(pot_dup["entity2_id"]),
            analyze=eda,
            similarity_score=pot_dup["score"],
        )
        for pot_dup in potential_duplicates
    )

    while True:
        batch = list(islice(entity_duplicates, batch_size))
        if not batch:
            break
        EntityDuplicate.objects.bulk_create(batch, batch_size, ignore_conflicts=True)

    eda.finished_at = now()
    eda.save()
