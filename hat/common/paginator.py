from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger


def paginate(request, objects, prefix_url: str, page_size=25) -> dict:
    paginator = Paginator(objects, page_size)

    page = request.GET.get('page')
    try:
        items = paginator.page(page)
    except PageNotAnInteger:
        # If page is not an integer, deliver first page.
        items = paginator.page(1)
    except EmptyPage:
        # If page is out of range (e.g. 9999), deliver last page of results.
        items = paginator.page(paginator.num_pages)

    next_url = None
    prev_url = None

    if items.has_next():
        qs = request.GET.copy()
        qs['page'] = items.next_page_number()
        next_url = prefix_url + qs.urlencode()
    if items.has_previous():
        qs = request.GET.copy()
        qs['page'] = items.previous_page_number()
        prev_url = prefix_url + qs.urlencode()

    return {
        'items': items,
        'count': objects.count(),
        'next_url': next_url,
        'prev_url': prev_url,
    }
