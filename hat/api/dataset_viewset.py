from functools import wraps
from datetime import datetime, timedelta, date
from calendar import monthrange
import pytz
from django.db import connection
from django.db.models import Count, Min, Max
from django.db.models.expressions import RawSQL
from django.core.exceptions import ValidationError
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound
from hat.cases.models import CaseView
from hat.common.jsonschema_validator import DefaultValidator
from hat.cases.filters import \
    resolve_dateperiod, \
    Q_screening, \
    Q_screening_positive, \
    Q_confirmation, \
    Q_confirmation_positive, \
    Q_staging, \
    Q_staging_stage1, \
    Q_staging_stage2
from hat.queries import stats_queries, microplanning_queries

datasets = {}

DATE_FORMAT = "%Y-%m-%d"


def parse_date_range(params, default_date_from=None):
    today = date.today()
    date_from = default_date_from or datetime(today.year, today.month, today.day)
    date_to = datetime(today.year, today.month, today.day) + timedelta(days=1)
    if 'date_from' in params:
        date_from = datetime.strptime(params['date_from'], DATE_FORMAT)
    if 'date_to' in params:
        date_to = datetime.strptime(params['date_to'], DATE_FORMAT) + timedelta(days=1)
    return (date_from, date_to)


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
        'date_from': {'type': 'string'},
        'date_to': {'type': 'string'},
        'location': {'type': 'string'},
        'source': {'type': 'string'},
        'offset': {'type': 'string'},
    },
    'additionalProperties': False,
}


def get_cases_filtered(params, ignore_params=None):
    '''
    Takes the requests parameters as args and returns a filtered CaseView QuerySet.
    '''
    def get_param_value(key):
        if ignore_params is not None and key in ignore_params:
            return None
        else:
            value = params.get(key, None)
            return value if value != '' else None

    cases = CaseView.objects

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

    date_from = get_param_value('date_from')
    date_to = get_param_value('date_to')
    if date_from is not None:
        date_from = datetime.strptime(date_from, DATE_FORMAT)
        cases = cases.filter(document_date__gte=date_from)
    if date_to is not None:
        date_to = datetime.strptime(date_to, DATE_FORMAT) + timedelta(days=1)
        cases = cases.filter(document_date__lt=date_to)

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
    tested = cases.filter(Q_screening | Q_confirmation | Q_staging)
    return {
        'registered': cases.count(),
        'tested': tested.count()
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
def count_staging(params):
    cases = get_cases_filtered(params).filter(Q_staging)
    return {
        'total': cases.count(),
        'stage1': cases.filter(Q_staging_stage1).count(),
        'stage2': cases.filter(Q_staging_stage2).count()
    }


@dataset(params_schema=params_schema)
def campaign_meta(params):
    cases = get_cases_filtered(params)
    return {
        'startdate': cases.aggregate(Min('document_date'))['document_date__min'],
        'enddate': cases.aggregate(Max('document_date'))['document_date__max'],
        'as_visited': cases.values('ZS', 'AS').distinct().count(),
        'villages_visited': cases.values('ZS', 'AS', 'village').distinct().count()
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


@dataset(params_schema={
    'type': 'object',
    'properties': {
        'date_from': {'type': 'string'},
        'date_to': {'type': 'string'},
        'location': {'type': 'string'},
    }
})
def population_coverage(params):
    (date_from, date_to) = parse_date_range(params)

    sql_context = {
        'date_from': date_from,
        'date_to': date_to
    }
    if 'location' in params:
        sql_context['zone_sante'] = params['location']
    if 'source' in params:
        sql_context['source'] = params['source']

    sql = stats_queries.population_coverage(**sql_context)

    with connection.cursor() as cursor:
        cursor.execute(sql)
        columns = [col[0] for col in cursor.description]
        # convert the single row tuple to a dict
        return dict(zip(columns, cursor.fetchone()))


@dataset(params_schema={
    'type': 'object',
    'properties': {
        'date_from': {'type': 'string'},
        'date_to': {'type': 'string'},
        'location': {'type': 'string'},
        'source': {'type': 'string'},
    },
    'additionalProperties': False,
})
def cases_over_time(params):
    (date_from, date_to) = parse_date_range(params)

    sql_context = {
        'date_from': date_from,
        'date_to': date_to,
        'date_interval': '1 days',
        'date_trunc_to': 'day',
    }
    if 'location' in params:
        sql_context['zone_sante'] = params['location']
    if 'source' in params:
        sql_context['source'] = params['source']

    sql = stats_queries.cases_over_time(**sql_context)

    with connection.cursor() as cursor:
        cursor.execute(sql)
        columns = [col[0] for col in cursor.description]
        # convert the row tuple to dicts to dicts
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


@dataset(params_schema={
    'type': 'object',
    'properties': {
        'date_from': {'type': 'string'},
        'date_to': {'type': 'string'},
        'location': {'type': 'string'},
        'caseyearfrom': {'type': 'string'},
    }
})
def data_by_location(params):
    '''
    View to list and retrieve the official list of villages
    with their meaningful info like confirmed cases, screened people...
    '''

    # first expected date is 2000-01-01
    (date_from, date_to) = parse_date_range(params, datetime(2000, 1, 1))
    # last expected date is 31st December current year
    currentYear = date.today().year

    sql_context = {
        'date_from': date_from,
        'date_to': date_to,
    }

    if 'location' in params:
        sql_context['zones_sante'] = params['location'].lower().split(',')
    if 'caseyearfrom' in params:
        yearfrom = currentYear - int(params['caseyearfrom'])
        sql_context['casedatefrom'] = datetime(yearfrom, 1, 1)

    sql = microplanning_queries.data_by_location(**sql_context)

    with connection.cursor() as cursor:
        cursor.execute(sql)
        columns = [col[0] for col in cursor.description]
        # convert the row tuple to dicts to dicts
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


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
