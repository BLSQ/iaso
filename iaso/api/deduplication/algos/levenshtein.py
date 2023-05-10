from typing import List

from django.db import connection

from ..common import PotentialDuplicate
from .base import DeduplicationAlgorithm
from .finalize import finalize_from_task

LEVENSHTEIN_MAX_DISTANCE = 3
ABOVE_SCORE_DISPLAY = 50

# We need to make sure the extension is loaded in the database
# CREATE EXTENSION fuzzystrmatch;


def _build_query(params):

    print("params", params)
    the_fields = params.get("fields", [])
    custom_params = params.get("parameters", {})
    levenshtein_max_distance = custom_params.get("levenshtein_max_distance", LEVENSHTEIN_MAX_DISTANCE)
    above_score_display = custom_params.get("above_score_display", ABOVE_SCORE_DISPLAY)
    n = len(the_fields)
    fields_comparison = " + ".join(
        f"(1.0 - (levenshtein_less_equal(instance1.json->>'{field}', instance2.json->>'{field}', {levenshtein_max_distance}) / {levenshtein_max_distance}::float))"
        for field in the_fields
    )

    # verifier que les champs sont pas du SQL injection

    return f"""
    SELECT * FROM (
        SELECT
        entity1.id,
        entity2.id,
        cast (({fields_comparison}) / {n} * 100 as smallint) as score
        FROM iaso_entity entity1, iaso_entity entity2, iaso_instance instance1, iaso_instance instance2
        WHERE entity1.id != entity2.id
        AND entity1.attributes_id = instance1.id
        AND entity2.attributes_id = instance2.id
        AND entity1.created_at > entity2.created_at
        AND entity1.entity_type_id = {params.get("entity_type_id")}
        AND entity2.entity_type_id = {params.get("entity_type_id")}
        AND NOT EXISTS (SELECT id FROM iaso_entityduplicate WHERE iaso_entityduplicate.entity1_id = entity1.id AND iaso_entityduplicate.entity2_id = entity2.id)
    ) AS subquery_high_score WHERE score > {above_score_display} ORDER BY score DESC
    """


@DeduplicationAlgorithm.register("levenshtein")
class InverseAlgorithm(DeduplicationAlgorithm):
    """
    This algorithm has the following custom parameters:
    levenshtein_max_distance: the maximum distance for the levenshtein algorithm (defaults to LEVENSHTEIN_MAX_DISTANCE)
    above_score_display: the minimum score to display (defaults to ABOVE_SCORE_DISPLAY)
    """

    def run(self, params, task=None) -> List[PotentialDuplicate]:

        count = 100

        task.report_progress_and_stop_if_killed(
            progress_value=0,
            end_value=count,
            progress_message=f"Started InverseAlgorithm",
        )

        print(f"Received params: {params}")

        cursor = connection.cursor()
        potential_duplicates = []
        try:
            the_query = _build_query(params)
            print(the_query)
            cursor.execute(the_query)
            while True:
                records = cursor.fetchmany(size=100)

                if not records:
                    break

                for record in records:
                    print(record[0], record[1], record[2])
                    potential_duplicates.append(PotentialDuplicate(record[0], record[1], record[2]))
        finally:
            cursor.close()

        task.report_progress_and_stop_if_killed(
            progress_value=100,
            end_value=count,
            progress_message=f"Ended InverseAlgorithm",
        )

        finalize_from_task(task, potential_duplicates)

        return f"found duplicates :{len(potential_duplicates)}"
