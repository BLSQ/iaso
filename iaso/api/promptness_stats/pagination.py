from functools import partial
from typing import Optional

from django.core.paginator import Paginator as DjangoPaginator

from iaso.api.common import Paginator


class CountedDjangoPaginator(DjangoPaginator):
    """Django paginator that receives the total number of rows, instead of counting the paginated queryset."""

    def __init__(self, object_list, per_page, count: int, **kwargs):
        super().__init__(object_list, per_page, **kwargs)
        self._count = count

    @property
    def count(self) -> int:
        return self._count


class PromptnessStatsPagination(Paginator):
    page_size = 20

    def paginate_queryset(self, queryset, request, view=None, count: Optional[int] = None):
        """`count`: number of rows of `queryset`, when it is cheaper to count them on another queryset.

        Counting the rows annotated with their counts would compute the targets and their join with the rows only to
        count the rows: the view counts the rows before annotating them, and gives that number here.
        """
        if count is not None:
            # DRF builds its Django paginator with `self.django_paginator_class(queryset, page_size)`
            self.django_paginator_class = partial(CountedDjangoPaginator, count=count)
        return super().paginate_queryset(queryset, request, view)
