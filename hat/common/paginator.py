from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger


def paginate(request, objects, prefix_url: str, page_size=25) -> dict:
    def get_page_url(p):
        qs = request.GET.copy()
        qs['page'] = p
        return prefix_url + qs.urlencode()

    paginator = Paginator(objects, page_size)
    count = objects.count()
    page = request.GET.get('page')
    total = paginator.num_pages

    try:
        items = paginator.page(page)
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
        page = int(page)
        if page > 1:
            first_url = get_page_url(1)
        if page > 2:
            prev_url = get_page_url(page - 1)
        if page < total - 1:
            next_url = get_page_url(page + 1)
        if page < total:
            last_url = get_page_url(total)

    return {
        'items': items,
        'count': count,
        'current': page,
        'total': total,
        'first_url': first_url,
        'prev_url': prev_url,
        'next_url': next_url,
        'last_url': last_url,
    }
