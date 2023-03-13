import json

from django.core.paginator import Paginator


def queryset_iterator(queryset, chunk_size=1000):
    """
    Iterate over a Django Queryset
    Unlike its previous implementation, it does not require to sort on the primary key.
    This method loads a maximum of chunk_size (default: 1000) rows in it's
    memory at the same time while django normally would load all rows in it's
    memory. Using the iterator() method only causes it to not preload all the
    classes.
    From https://github.com/django-import-export/django-import-export/issues/774
    """
    if queryset._prefetch_related_lookups:
        if not queryset.query.order_by:
            # Paginator() throws a warning if there is no sorting attached to the queryset
            queryset = queryset.order_by("pk")
        paginator = Paginator(queryset, chunk_size)
        for index in range(paginator.num_pages):
            yield from paginator.get_page(index + 1)
    else:
        yield from queryset.iterator(chunk_size=chunk_size)


def is_json_serializable(x):
    try:
        json.dumps(x)
        return True
    except Exception as e:
        print(e)
        return False
