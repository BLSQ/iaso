from functools import wraps
from datetime import datetime, timedelta
from calendar import monthrange
import pytz
from django.db.models import Count, Min, Max
from django.db.models.expressions import RawSQL
from django.core.exceptions import ValidationError
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound
from hat.cases.models import Case
from hat.common.jsonschema_validator import DefaultValidator
from hat.cases.filters import \
    resolve_dateperiod, \
    Q_screening, \
    Q_screening_positive, \
    Q_confirmation, \
    Q_confirmation_positive, \
    Q_staging \

datasets = {}


def dataset(params_schema=None):
    '''
    Decorator to add a query function to the dataset.
    Takes an optional schema to validate the request parameters against.
    '''
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        datasets[func.__name__] = {
            'getter': wrapper,
            'params_schema': params_schema
        }
        return wrapper
    return decorator


params_schema = {
    'type': 'object',
    'properties': {
        'date': {'type': 'string'},
        'dateperiod': {'type': 'string'},
        'location': {'type': 'string'},
        'source': {'type': 'string'},
        'offset': {'type': 'string'},
        'caseperiod': {'type': 'string'},
        'screeningperiod': {'type': 'string'},
    },
    'additionalProperties': False,
}


def get_cases_filtered(params, ignore_params=None):
    '''
    Takes the requests parameters as args and returns a filtered Case QuerySet.
    '''
    def get_param_value(key):
        if ignore_params is not None and key in ignore_params:
            return None
        else:
            value = params.get(key, None)
            return value if value != '' else None

    cases = Case.objects

    date = get_param_value('date')
    if date is not None:
        # Parse time with manually added UTC timezone offset
        date_from = datetime.strptime(date + "-+0000", "%Y-%m-%z")
        # Get the last day of the month
        (_, last_day) = monthrange(date_from.year, date_from.month)
        # Construct the upper bound of our date range
        date_to = datetime(date_from.year, date_from.month, last_day, tzinfo=pytz.UTC) \
            + timedelta(days=1)
        cases = cases.filter(document_date__gte=date_from, document_date__lt=date_to)

    dateperiod = get_param_value('dateperiod')
    if dateperiod is not None:
        (date_from, date_to) = resolve_dateperiod(dateperiod)
        cases = cases.filter(document_date__gte=date_from, document_date__lt=date_to)

    location = get_param_value('location')
    if location is not None:
        cases = cases.filter(ZS=location)

    source = get_param_value('source')
    if source is not None:
        cases = cases.filter(source=source)

    return cases


@dataset(params_schema=params_schema)
def list_locations(params):
    cases = get_cases_filtered(params, ignore_params=['location'])
    return cases.order_by().values('ZS').distinct()


@dataset(params_schema=params_schema)
def count_total(params):
    cases = get_cases_filtered(params)
    tested = cases.filter(Q_screening | Q_confirmation)
    return {
        'registered': cases.count(),
        'tested': tested.count(),
        'male': tested.filter(sex='male').count(),
        'female': tested.filter(sex='female').count()
    }


@dataset(params_schema=params_schema)
def count_screened(params):
    cases = get_cases_filtered(params).filter(Q_screening)
    return {
        'total': cases.count(),
        'positive': cases.filter(Q_screening_positive).count(),
        'negative': cases.exclude(Q_screening_positive).count(),
        'missing_confirmation': cases.filter(Q_screening_positive)
                                     .exclude(Q_confirmation).count()
    }


@dataset(params_schema=params_schema)
def count_confirmed(params):
    cases = get_cases_filtered(params).filter(Q_confirmation)
    return {
        'total': cases.count(),
        'positive': cases.filter(Q_confirmation_positive).count(),
        'negative': cases.exclude(Q_confirmation_positive).count()
    }


@dataset(params_schema=params_schema)
def campaign_meta(params):
    cases = get_cases_filtered(params)
    return {
        'startdate': cases.aggregate(Min('document_date'))['document_date__min'],
        'enddate': cases.aggregate(Max('document_date'))['document_date__max'],
        'az_visited': cases.order_by().values('AZ').distinct().count(),
        'villages_visited': cases.order_by().values('village').distinct().count()
    }


@dataset(params_schema=params_schema)
def tested_per_day(params):
    cases = get_cases_filtered(params)
    tested = cases.filter(Q_screening | Q_confirmation | Q_staging) \
                  .annotate(date=RawSQL('date_trunc(\'day\', document_date)', [])) \
                  .values('date') \
                  .annotate(count=Count('document_id')) \
                  .order_by('date')
    # order_by is needed to remove 'document_date' from the GROUP BY statement
    # see comment on https://jira.ehealthafrica.org/browse/HAT-262

    date = params.get('date', None)
    if date is None or date == '':
        raise ValidationError('Dataset requires date query string parameter')
    # Generate a result list that includes every day in the month.
    # Otherwise the list would only contain the days that have data.
    (year, month) = [int(x) for x in date.split('-')]
    (_, num_days) = monthrange(year, month)
    result = [{'count': 0, 'day': i+1} for i in range(num_days)]
    for t in tested:
        day = t['date'].day
        result[day - 1] = {'count': t['count'], 'day': day}
    return result


@dataset(params_schema=params_schema)
def confirmed_by_location(params):
    params['dateperiod'] = params.get('caseperiod', None)

    cases = get_cases_filtered(params, ignore_params=['caseperiod', 'screeningperiod']) \
        .filter(Q_confirmation) \
        .filter(Q_confirmation_positive) \
        .values('province', 'ZS', 'AZ', 'village') \
        .annotate(confirmed_cases=Count('document_id')) \
        .annotate(last_confirmed_date=Max('document_date')) \
        .order_by('province', 'ZS', 'AZ', 'village')

    # visits = get_cases_filtered(params, ignore_params=['caseperiod', 'screeningperiod'])
    # visits = visits.filter(Q_screening) \
    #     .values('province', 'ZS', 'AZ', 'village') \
    #     .annotate(last_screening_date=Max('document_date')) \
    #     .order_by('province', 'ZS', 'AZ', 'village')

    return cases


class DatasetViewSet(viewsets.ViewSet):
    '''
    View to list and retrieve registered datasets
    '''
    def list(self, request):
        items = []
        for k, v in datasets.items():
            items.append({
                'name': k,
                'url': reverse('api:datasets-detail', args=[k], request=request),
                'params_schema': v['params_schema']
            })
        return Response(items)

    def retrieve(self, request, pk=None):
        item = datasets.get(pk, None)
        if item is None:
            raise NotFound()
        # We have to convert the query dict to a regular dict, because the json schema validation
        # might mutate the params dict with default values.
        params = dict(request.GET.items())
        if not item['params_schema'] is None:
            DefaultValidator(item['params_schema']).validate(params)
        return Response(item['getter'](params))
