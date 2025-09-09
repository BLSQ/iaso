from itertools import islice
from typing import List

from django.utils.timezone import now

from iaso.api.deduplication.common import PotentialDuplicate
from iaso.models import EntityDuplicate
from iaso.models.base import Task


def create_entity_duplicates(task: Task, potential_duplicates: List[PotentialDuplicate]) -> None:
    eda = task.entity_duplicate_analyzis.first()

    if not eda:
        raise Exception("No entity duplicate analyze found for task %s" % task)

    task.report_progress_and_stop_if_killed(progress_message="Started creation of entity duplicates")

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
        task.report_progress_and_stop_if_killed(progress_message=f"Bulk creating {batch_size} entity duplicates")
        EntityDuplicate.objects.bulk_create(batch, batch_size, ignore_conflicts=True)

    eda.finished_at = now()
    eda.save()

    task.report_progress_and_stop_if_killed(progress_message="Ended creation of entity duplicates")
