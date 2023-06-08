from typing import List
from iaso.api.deduplication.common import PotentialDuplicate
from iaso.models.base import Task

from django.utils.timezone import now
from django.apps import apps


def finalize_from_task(the_task: Task, potential_duplicates: List[PotentialDuplicate]):
    eda = the_task.entity_duplicate_analyze.first()
    ed_model = apps.get_model("iaso", "EntityDuplicate")

    for pot_dup in potential_duplicates:
        ed, _ = ed_model.objects.get_or_create(
            entity1_id=int(pot_dup["entity1_id"]),
            entity2_id=int(pot_dup["entity2_id"]),
            analyze=eda,
            defaults={
                "similarity_score": pot_dup["score"],
            },
        )
        ed.save()

    eda.finished_at = now()
    eda.save()
