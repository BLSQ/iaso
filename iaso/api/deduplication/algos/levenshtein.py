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
        print(f"Processing field: {f_name} with type: {f_type}")  # Debug log
        if f_type == "number" or f_type == "integer" or f_type == "decimal":
            # if field is a number we need to get as a result the difference between the two numbers
            # the final value should be 1 - (abs(number1 - number2) / max(number1, number2))
            fc_arr.append(
                "(1.0 - ( abs ( (instance1.json->>%s)::double precision - (instance2.json->>%s)::double precision ) / greatest( (instance1.json->>%s)::double precision, (instance2.json->>%s)::double precision )))"
            )
            query_params.extend([f_name, f_name, f_name, f_name])
        elif f_type == "text" or f_type is None:  # Handle both text and undefined types as text
            fc_arr.append("(1.0 - (levenshtein_less_equal(instance1.json->>%s, instance2.json->>%s, %s) / %s::float))")
            query_params.extend([f_name, f_name, levenshtein_max_distance, levenshtein_max_distance])
        elif f_type == "calculate":
            # Handle type casting based on field name suffix
            if f_name.endswith(("__int__", "__integer__")):
                cast_type = "integer"
            elif f_name.endswith("__long__"):
                cast_type = "bigint"
            elif f_name.endswith(("__decimal__", "__double__")):
                cast_type = "double precision"
            elif f_name.endswith(("__bool__", "__boolean__")):
                cast_type = "boolean"
            elif f_name.endswith("__date__"):
                cast_type = "date"
            elif f_name.endswith("__time__"):
                cast_type = "time"
            elif f_name.endswith(("__date_time__", "__datetime__")):
                cast_type = "timestamp"
            else:
                # Default to text comparison if no type suffix is found
                fc_arr.append(
                    "(1.0 - (levenshtein_less_equal(instance1.json->>%s, instance2.json->>%s, %s) / %s::float))"
                )
                query_params.extend([f_name, f_name, levenshtein_max_distance, levenshtein_max_distance])
                continue

            # For numeric types, use the same comparison as numbers
            if cast_type in ["integer", "bigint", "double precision"]:
                fc_arr.append(
                    "(1.0 - ( abs ( (instance1.json->>%s)::"
                    + cast_type
                    + " - (instance2.json->>%s)::"
                    + cast_type
                    + " ) / greatest( (instance1.json->>%s)::"
                    + cast_type
                    + ", (instance2.json->>%s)::"
                    + cast_type
                    + " )))"
                )
                query_params.extend([f_name, f_name, f_name, f_name])
            # For boolean types, compare as 0/1
            elif cast_type == "boolean":
                fc_arr.append(
                    "(1.0 - abs( (instance1.json->>%s)::"
                    + cast_type
                    + "::integer - (instance2.json->>%s)::"
                    + cast_type
                    + "::integer ))"
                )
                query_params.extend([f_name, f_name])
            # For date/time types, compare as timestamps
            elif cast_type in ["date", "time", "timestamp"]:
                if cast_type == "date":
                    fc_arr.append(
                        "(1.0 - abs( (instance1.json->>%s)::"
                        + cast_type
                        + " - (instance2.json->>%s)::"
                        + cast_type
                        + " )::integer / 365 )"
                    )
                elif cast_type == "time":
                    fc_arr.append(
                        "(1.0 - abs( justify_interval((instance1.json->>%s)::"
                        + cast_type
                        + " - (instance2.json->>%s)::"
                        + cast_type
                        + " )::interval / interval '1 day' ))"
                    )
                else:  # timestamp
                    fc_arr.append(
                        "(1.0 - abs( justify_interval((instance1.json->>%s)::"
                        + cast_type
                        + " - (instance2.json->>%s)::"
                        + cast_type
                        + " )::interval / interval '1 year' ))"
                    )
                query_params.extend([f_name, f_name])

    fields_comparison = " + ".join(fc_arr)

    query_params.extend([params.get("entity_type_id"), params.get("entity_type_id"), above_score_display])

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
            progress_message="Started Levenshtein Algorithm",
        )

        cursor = connection.cursor()
        potential_duplicates = []
        try:
            the_params, the_query = _build_query(params)

            # Log the generated query and parameters just before execution
            task.report_progress_and_stop_if_killed(
                progress_value=10,
                end_value=count,
                progress_message="=== SQL Query ===\n"
                + the_query
                + "\n=== Parameters ===\n"
                + str(the_params)
                + "\n=== End Query ===",
            )

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
            progress_message="Ended Levenshtein Algorithm",
        )

        finalize_from_task(task, potential_duplicates)

        return potential_duplicates
