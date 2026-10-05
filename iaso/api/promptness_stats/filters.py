from rest_framework.filters import OrderingFilter


class StableOrderingFilter(OrderingFilter):
    """`OrderingFilter` that always ends the ordering with the primary key.

    Without it, rows with equal values for the requested ordering (e.g. 2 org units with the same number of late
    submissions) come back in an undefined order, which can change from one query to the next: with pagination,
    a row could then appear on 2 pages, or on none.
    """

    def get_ordering(self, request, queryset, view):
        ordering = super().get_ordering(request, queryset, view) or []
        if "id" not in ordering and "-id" not in ordering:
            ordering = [*ordering, "id"]
        return ordering


class PromptnessStatsOrderingFilter(StableOrderingFilter):
    """`StableOrderingFilter` where the not applicable rows (nothing expected) always come last when ordering on a
    figure (a count or a percentage), whatever the direction of the ordering.

    Without it, Postgres would put the not applicable rows (`NULL` percentages) first in descending order, and mix them
    with the rows at 0 when ordering on a count. The view lists the figures in `not_applicable_last_fields`; the rows
    must be annotated with `is_applicable` (see `annotate_counts()`).
    """

    def get_ordering(self, request, queryset, view):
        ordering = super().get_ordering(request, queryset, view)
        not_applicable_last_fields = getattr(view, "not_applicable_last_fields", [])
        for position, field in enumerate(ordering):
            if field.removeprefix("-") in not_applicable_last_fields:
                # Before the first figure: the fields before it (e.g. `name`) keep their ordering
                return [*ordering[:position], "-is_applicable", *ordering[position:]]
        return ordering
