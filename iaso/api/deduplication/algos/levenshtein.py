from typing import List

from django.db import connection

from iaso.models.base import Task

from ..common import PotentialDuplicate
from .base import DeduplicationAlgorithm
from .finalize import create_entity_duplicates


LEVENSHTEIN_MAX_DISTANCE = 3
ABOVE_SCORE_DISPLAY = 50

# We need to make sure the extension is loaded in the database
# CREATE EXTENSION fuzzystrmatch;


def _build_query(params):
    reference_form_fields = params.get("fields", [])
    custom_params = params.get("parameters", {})
    levenshtein_max_distance = custom_params.get("levenshtein_max_distance", LEVENSHTEIN_MAX_DISTANCE)
    above_score_display = custom_params.get("above_score_display", ABOVE_SCORE_DISPLAY)
    n = len(reference_form_fields)
    fc_arr = []
    query_params = []
    for field in reference_form_fields:
        f_name = field.get("name")
        f_type = field.get("type")

        if f_type in ["number", "integer", "decimal"]:
            # if field is a number we need to get as a result the difference between the two numbers
            # the final value should be 1 - (abs(number1 - number2) / max(number1, number2))
            fc_arr.append(
                "(1.0 - (CASE "
                "WHEN (instance1.json->>%s) IS NOT NULL AND (instance1.json->>%s) != '' AND (instance2.json->>%s) IS NOT NULL AND (instance2.json->>%s) != '' "
                "THEN abs( (instance1.json->>%s)::double precision - (instance2.json->>%s)::double precision ) / greatest( (instance1.json->>%s)::double precision, (instance2.json->>%s)::double precision ) "
                "ELSE NULL END))"
            )
            query_params.extend([f_name, f_name, f_name, f_name, f_name, f_name, f_name, f_name])

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
                    "(1.0 - (CASE "
                    "WHEN (instance1.json->>%s) IS NOT NULL AND (instance1.json->>%s) != '' AND (instance2.json->>%s) IS NOT NULL AND (instance2.json->>%s) != '' "
                    "THEN abs( (instance1.json->>%s)::"
                    + cast_type
                    + " - (instance2.json->>%s)::"
                    + cast_type
                    + " ) / greatest( (instance1.json->>%s)::"
                    + cast_type
                    + ", (instance2.json->>%s)::"
                    + cast_type
                    + " ) "
                    "ELSE NULL END))"
                )
                query_params.extend([f_name, f_name, f_name, f_name, f_name, f_name, f_name, f_name])

            # For boolean types, compare as 0/1
            elif cast_type == "boolean":
                fc_arr.append(
                    "(1.0 - (CASE "
                    "WHEN (instance1.json->>%s) IS NOT NULL AND (instance1.json->>%s) != '' AND (instance2.json->>%s) IS NOT NULL AND (instance2.json->>%s) != '' "
                    "THEN abs( (instance1.json->>%s)::"
                    + cast_type
                    + "::integer - (instance2.json->>%s)::"
                    + cast_type
                    + "::integer ) "
                    "ELSE NULL END))"
                )
                query_params.extend([f_name, f_name, f_name, f_name, f_name, f_name])

            # For date/time types, compare as timestamps
            elif cast_type == "date":
                fc_arr.append(
                    "(1.0 - (CASE "
                    "WHEN (instance1.json->>%s) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND (instance2.json->>%s) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' "
                    "THEN abs(EXTRACT(EPOCH FROM ((instance1.json->>%s)::date::timestamp - (instance2.json->>%s)::date::timestamp))/86400.0) "
                    "ELSE NULL END))"
                )
                query_params.extend([f_name, f_name, f_name, f_name])

            elif cast_type == "time":
                fc_arr.append(
                    "(1.0 - (CASE "
                    "WHEN (instance1.json->>%s) ~ '^[0-9]{2}:[0-9]{2}:[0-9]{2}' AND (instance2.json->>%s) ~ '^[0-9]{2}:[0-9]{2}:[0-9]{2}' "
                    "THEN abs(EXTRACT(EPOCH FROM ((instance1.json->>%s)::time - (instance2.json->>%s)::time))/86400.0) "
                    "ELSE NULL END))"
                )
                query_params.extend([f_name, f_name, f_name, f_name])

            elif cast_type == "timestamp":
                fc_arr.append(
                    "(1.0 - (CASE "
                    "WHEN (instance1.json->>%s) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}' AND (instance2.json->>%s) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}' "
                    "THEN abs(EXTRACT(EPOCH FROM ((instance1.json->>%s)::timestamp - (instance2.json->>%s)::timestamp))/31536000.0) "
                    "ELSE NULL END))"
                )
                query_params.extend([f_name, f_name, f_name, f_name])

    fields_comparison = " + ".join(fc_arr)
    query_params = [params.get("entity_type_id")] + query_params + [above_score_display]

    return (
        query_params,
        f"""
    /*
    A materialized CTE is computed and stored temporarily at the beginning of the query execution.
    Without MATERIALIZED, PostgreSQL might execute the CTE multiple times.
    */
    WITH filtered_entities AS MATERIALIZED (
        SELECT id, attributes_id
        FROM iaso_entity
        WHERE entity_type_id = %s AND deleted_at IS NULL
    ),
    /*
    With MATERIALIZED, each entity's JSON should be extracted exactly once.
    `n` entities × JSON size = predictable memory footprint.
    */
    entity_instances_json AS MATERIALIZED (
        SELECT
            e.id AS entity_id,
            i.json
        FROM filtered_entities AS e
        JOIN iaso_instance AS i ON e.attributes_id = i.id
    ),
    /*
    Pre-filter pairs before expensive calculations.
    */
    candidate_pairs AS (
        SELECT
            e1.entity_id AS entity_id1,
            e2.entity_id AS entity_id2,
            e1.json AS json1,
            e2.json AS json2
        FROM entity_instances_json AS e1
        CROSS JOIN entity_instances_json AS e2
        WHERE e1.entity_id > e2.entity_id
        AND NOT EXISTS (
            SELECT 1
            FROM iaso_entityduplicate d
            WHERE d.entity1_id = e1.entity_id
              AND d.entity2_id = e2.entity_id
        )
    ),
    scored_pairs AS (
        SELECT
            entity_id1,
            entity_id2,
            CAST(
                GREATEST(
                    LEAST(
                        COALESCE(
                            ({fields_comparison.replace("instance1.json", "json1").replace("instance2.json", "json2")}) / NULLIF({n}, 0) * 100,
                            0
                        ),
                        100
                    ),
                    0
                ) AS SMALLINT
            ) AS score
        FROM candidate_pairs
    )
    SELECT entity_id1, entity_id2, score
    FROM scored_pairs
    WHERE score > %s
    ORDER BY score DESC;
    """,
    )


class LevenshteinAlgorithm(DeduplicationAlgorithm):
    """
    This algorithm has the following custom parameters:
    levenshtein_max_distance: the maximum distance for the levenshtein algorithm (defaults to LEVENSHTEIN_MAX_DISTANCE)
    above_score_display: the minimum score to display (defaults to ABOVE_SCORE_DISPLAY)
    """

    def run(self, params: dict, task: Task) -> List[PotentialDuplicate]:
        task.report_progress_and_stop_if_killed(progress_message="Started Levenshtein Algorithm")

        cursor = connection.cursor()
        potential_duplicates = []
        try:
            the_params, the_query = _build_query(params)

            # Log the generated query and parameters just before execution
            task.report_progress_and_stop_if_killed(
                progress_message="=== SQL Query ===\n"
                + the_query
                + "\n=== Parameters ===\n"
                + str(the_params)
                + "\n=== End Query ===",
            )

            cursor.execute(the_query, the_params)

            while True:
                # We can use a large batch size here since the results are lightweight
                # (just 3 fields: entity1_id, entity2_id, score).
                records = cursor.fetchmany(size=1000)

                if not records:
                    break

                for record in records:
                    potential_duplicates.append(PotentialDuplicate(record[0], record[1], record[2]))
        finally:
            cursor.close()

        task.report_progress_and_stop_if_killed(progress_message="Ended Levenshtein Algorithm")

        create_entity_duplicates(task, potential_duplicates)

        return potential_duplicates
