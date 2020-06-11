from functools import reduce

from django.db.models import Q


def years_filter(years):
    year_filters = []
    range_year = None
    start_year_range = None
    for year in sorted(years):
        if not range_year:
            start_year_range = f"{year}-01-01"
            range_year = year
        elif int(range_year) == int(year) - 1:
            range_year = year
        else:
            year_filters.append(
                Q(infection_cases__document_date__gte=start_year_range)
                & Q(infection_cases__document_date__lte=f"{range_year}-12-31")
            )
            start_year_range = f"{year}-01-01"
            range_year = year
    year_filters.append(
        Q(infection_cases__document_date__gte=start_year_range)
        & Q(infection_cases__document_date__lte=f"{range_year}-12-31")
    )
    return reduce(lambda x, y: x | y, year_filters)
