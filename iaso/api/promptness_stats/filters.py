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
