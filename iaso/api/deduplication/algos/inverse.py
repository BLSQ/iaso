from typing import List

from django.db import connection

from ..common import PotentialDuplicate
from .base import DeduplicationAlgorithm


def _build_query(params):
    print("params", params)
    the_fields = params.get("fields", [])
    n = len(the_fields)
    fields_comparison = " + ".join(
        f"levenshtein(instance1.json->>'{field}', instance2.json->>'{field}')" for field in the_fields
    )
    fields_where = " AND ".join(f"instance1.json->>'{field}' LIKE instance2.json->>'{field}'" for field in the_fields)

    return f"""
    SELECT
    entity1.id,
    entity2.id,
    cast (({fields_comparison}) / {n} * 100 as smallint) as score
    FROM iaso_entity entity1, iaso_entity entity2, iaso_instance instance1, iaso_instance instance2
    WHERE entity1.id != entity2.id
    AND entity1.attributes_id = instance1.id
    AND entity2.attributes_id = instance2.id
    AND {fields_where}
    AND entity1.created_at > entity2.created_at
    AND NOT EXISTS (SELECT id FROM iaso_entityduplicate WHERE iaso_entityduplicate.entity1_id = entity1.id AND iaso_entityduplicate.entity2_id = entity2.id)
    """


@DeduplicationAlgorithm.register("inverse")
class InverseAlgorithm(DeduplicationAlgorithm):
    def run(self, params, task=None) -> List[PotentialDuplicate]:

        count = 100

        task.report_progress_and_stop_if_killed(
            progress_value=0,
            end_value=count,
            progress_message=f"Started InverseAlgorithm",
        )

        print(f"Received params: {params}")

        cursor = connection.cursor()
        try:
            the_query = _build_query(params)
            print(the_query)
            cursor.execute(the_query)
            while True:
                records = cursor.fetchmany(size=100)

                if not records:
                    break

                for record in records:
                    print("record", record)
        finally:
            cursor.close()

        task.report_progress_and_stop_if_killed(
            progress_value=100,
            end_value=count,
            progress_message=f"Ended InverseAlgorithm",
        )

        return [PotentialDuplicate(1, 2, 0.5), PotentialDuplicate(3, 4, 0.5)]
