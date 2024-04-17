from typing import List

from django.db import connection

from ..common import PotentialDuplicate  # type: ignore
from .base import DeduplicationAlgorithm
from .finalize import finalize_from_task

LEVENSHTEIN_MAX_DISTANCE = 3
ABOVE_SCORE_DISPLAY = 50

# We need to make sure the extension is loaded in the database
# CREATE EXTENSION fuzzystrmatch;


def _build_query(params):
    the_fields = params.get("fields", [])
    custom_params = params.get("parameters", {})
    levenshtein_max_distance = custom_params.get("levenshtein_max_distance", LEVENSHTEIN_MAX_DISTANCE)
    above_score_display = custom_params.get("above_score_display", ABOVE_SCORE_DISPLAY)
    n = len(the_fields)
    fc_arr = []
    query_params = []
    for field in the_fields:
        f_name = field.get("name")
        f_type = field.get("type")
        if f_type == "number" or f_type == "integer" or f_type == "decimal":
            # if field is a number we need to get as a result the difference between the two numbers
            # the final value should be 1 - (abs(number1 - number2) / max(number1, number2))
            fc_arr.append(
                f"(1.0 - ( abs ( (instance1.json->>%s)::double precision - (instance2.json->>%s)::double precision ) / greatest( (instance1.json->>%s)::double precision, (instance2.json->>%s)::double precision )))"
            )
            query_params.append(f_name)
            query_params.append(f_name)
            query_params.append(f_name)
            query_params.append(f_name)
        elif f_type == "text":
            fc_arr.append(f"(1.0 - (levenshtein_less_equal(instance1.json->>%s, instance2.json->>%s, %s) / %s::float))")
            query_params.append(f_name)
            query_params.append(f_name)
            query_params.append(levenshtein_max_distance)
            query_params.append(levenshtein_max_distance)

    fields_comparison = " + ".join(fc_arr)

    query_params.append(params.get("entity_type_id"))
    query_params.append(params.get("entity_type_id"))
    query_params.append(above_score_display)

    return (
        query_params,
        f"""
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
        AND entity1.entity_type_id = %s
        AND entity2.entity_type_id = %s
        AND entity1.deleted_at IS NULL
        AND entity2.deleted_at IS NULL
        AND NOT EXISTS (SELECT id FROM iaso_entityduplicate WHERE iaso_entityduplicate.entity1_id = entity1.id AND iaso_entityduplicate.entity2_id = entity2.id)
    ) AS subquery_high_score WHERE score > %s ORDER BY score DESC
    """,
    )


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
            progress_message=f"Started Levenshtein Algorithm",
        )

        cursor = connection.cursor()
        potential_duplicates = []
        try:
            the_params, the_query = _build_query(params)
            cursor.execute(the_query, the_params)

            while True:
                records = cursor.fetchmany(size=100)

                if not records:
                    break

                for record in records:
                    potential_duplicates.append(PotentialDuplicate(record[0], record[1], record[2]))
        finally:
            cursor.close()

        task.report_progress_and_stop_if_killed(
            progress_value=100,
            end_value=count,
            progress_message=f"Ended Levenshtein Algorithm",
        )

        finalize_from_task(task, potential_duplicates)

        return potential_duplicates
