from typing import NamedTuple, Any, Optional
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.http.request import HttpRequest
from django.db.models.query import QuerySet


class Page(NamedTuple):
    items: Any
    count: int
    current: int
    total: int

    first_url: Optional[str]
    prev_url: Optional[str]
    next_url: Optional[str]
    last_url: Optional[str]


def paginate(request: HttpRequest,
             objects: QuerySet,
             prefix_url: str,
             page_size: int = 20) -> Page:

    def get_page_url(p: int) -> str:
        qs = request.GET.copy()
        qs['page'] = p
        return prefix_url + qs.urlencode()

    paginator = Paginator(objects, page_size)
    total = paginator.num_pages
    count = objects.count()
    page = request.GET.get('page')

    try:
        items = paginator.page(page)
        page = int(page)
    except PageNotAnInteger:
        # If page is not an integer, deliver first page.
        page = 1
        items = paginator.page(1)
    except EmptyPage:
        # If page is out of range (e.g. 9999), deliver last page of results.
        page = paginator.num_pages
        items = paginator.page(total)

    first_url = None
    prev_url = None
    next_url = None
    last_url = None

    if count:
        if page > 1:
            first_url = get_page_url(1)
        if page > 2:
            prev_url = get_page_url(page - 1)
        if page < total - 1:
            next_url = get_page_url(page + 1)
        if page < total:
            last_url = get_page_url(total)

    return Page(
        items=items,
        count=count,
        current=page,
        total=total,

        first_url=first_url,
        prev_url=prev_url,
        next_url=next_url,
        last_url=last_url,
    )
