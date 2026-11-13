"""Ordering of the beneficiaries API.

The filters themselves (`entity_type`, `programme`, `org_unit_group`, `q`, `visit_date_after`,
`visit_date_before`) are shared with the exports, in
`plugins.wfp.filters`.
"""

from django.db.models import F


ORDERS = {
    "entity_id": "entity_id",
    "progress_id": "progress_id",
    "birth_date": "birth_date",
    "gender": "gender",
    "journeys_count": "journeys_count",
    "visits_count": "visits_count",
    "last_visit_date": "last_visit_date",
}


def ordering_from_param(order: str):
    """The ordering of the `order` query param (e.g. "-last_visit_date,entity_id"), most recent visits by default."""
    ordering = []
    for key in (order or "-last_visit_date").split(","):
        descending = key.startswith("-")
        field_name = ORDERS.get(key.lstrip("-"))

        if not field_name:
            continue

        expression = F(field_name)
        ordering.append(expression.desc(nulls_last=True) if descending else expression.asc(nulls_last=True))
    return ordering + ["-id"]
