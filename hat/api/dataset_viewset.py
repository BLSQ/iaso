from typing import Dict, Tuple, List, Any, Union, Callable, Optional
from hat.common.typing import JsonType
from functools import wraps
from datetime import datetime, timedelta, date
from calendar import monthrange
import pytz
from django.db import connection
from django.db.models import Count, Min, Max
from django.db.models.query import QuerySet
from django.core.exceptions import ValidationError

from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound

from hat.cases.models import CaseView, Location
from hat.common.jsonschema_validator import DefaultValidator
from hat.cases.filters import \
    Q_screening, Q_screening_positive, Q_screening_negative, \
    Q_confirmation, Q_confirmation_positive, Q_confirmation_negative, \
    Q_staging, Q_staging_stage1, Q_staging_stage2
from hat.queries import stats_queries, microplanning_queries
from hat.import_export.typing import ResultValues

datasets = {}

DATE_FORMAT = '%Y-%m-%d'

test_results = {
    'positive': ResultValues.positive.value,
    'negative': ResultValues.negative.value,
    'missing': ResultValues.missing.value,
    'absent': ResultValues.absent.value,
}


def localize_date(date: datetime) -> datetime:
    return pytz.UTC.localize(date)


def parse_date_range(params: Dict[str, str],
                     default_date_from: datetime=None) \
                     -> Tuple[datetime, datetime]:
    today = date.today()
    date_from = localize_date(
      default_date_from or datetime(today.year, today.month, today.day))
    date_to = localize_date(
      datetime(today.year, today.month, today.day) + timedelta(days=1))
    if 'date_from' in params:
        date_from = localize_date(datetime.strptime(params['date_from'], DATE_FORMAT))
    if 'date_to' in params:
        date_to = localize_date(
          datetime.strptime(params['date_to'], DATE_FORMAT) + timedelta(days=1))
    return (date_from, date_to)


def dataset(params_schema: JsonType=None) -> Callable:
    '''
    Decorator to add a query function to the dataset.
    Takes an optional schema to validate the request parameters against.
    '''
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
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
        'date_month': {'type': 'string'},
        'date_from': {'type': 'string'},
        'date_to': {'type': 'string'},
        'location': {'type': 'string'},
        'source': {'type': 'string'},
        'offset': {'type': 'string'},
    },
    'additionalProperties': False,
}


def get_cases_filtered(request: Request,
                       params: Dict[str, str],
                       ignore_params: List[str]=None) \
                       -> QuerySet:
    '''
    Takes the requests parameters as args and returns a filtered CaseView QuerySet.
    '''
    def get_param_value(key: str) -> Optional[str]:
        if ignore_params is not None and key in ignore_params:
            return None
        else:
            value = params.get(key, None)
            return value if value != '' else None

    cases = CaseView.objects

    date_month_param = get_param_value('date_month')
    if date_month_param is not None:
        date_month = localize_date(datetime.strptime(date_month_param + '-01', DATE_FORMAT))
        cases = cases.filter(document_date_month=date_month)

    date_from_param = get_param_value('date_from')
    date_to_param = get_param_value('date_to')
    if date_from_param is not None:
        date_from = localize_date(datetime.strptime(date_from_param, DATE_FORMAT))
        cases = cases.filter(document_date__gte=date_from)
    if date_to_param is not None:
        date_to = localize_date(datetime.strptime(date_to_param, DATE_FORMAT) + timedelta(days=1))
        cases = cases.filter(document_date__lt=date_to)

    restrict_to_zs = request.user.profile.restrict_to_zs
    if restrict_to_zs:
        cases = cases.filter(ZS=restrict_to_zs)
    else:
        location = get_param_value('location')
        if location is not None:
            cases = cases.filter(ZS=location)

    source = get_param_value('source')
    if source is not None:
        cases = cases.filter(source__icontains=source)

    return cases


@dataset(params_schema=params_schema)
def list_locations(request: Request, params: Dict[str, str]) -> List[str]:
    cases = get_cases_filtered(request, params, ignore_params=['location'])
    return cases.order_by('ZS').values_list('ZS', flat=True).distinct()


@dataset(params_schema=params_schema)
def count_total(request: Request, params: Dict[str, str]) -> Dict[str, int]:
    cases = get_cases_filtered(request, params)
    tested = cases.filter(Q_screening | Q_confirmation | Q_staging)
    return {
        'registered': cases.count(),
        'tested': tested.count()
    }


@dataset(params_schema=params_schema)
def count_screened(request: Request, params: Dict[str, str]) -> Dict[str, int]:
    cases = get_cases_filtered(request, params).filter(Q_screening)
    return {
        'total': cases.count(),
        'positive': cases.filter(Q_screening_positive).count(),
        'negative': cases.filter(Q_screening_negative).count(),
        'missing_confirmation': cases.filter(Q_screening_positive)
                                     .exclude(Q_confirmation).count()
    }


@dataset(params_schema=params_schema)
def count_confirmed(request: Request, params: Dict[str, str]) -> Dict[str, int]:
    cases = get_cases_filtered(request, params).filter(Q_confirmation)
    return {
        'total': cases.count(),
        'positive': cases.filter(Q_confirmation_positive).count(),
        'negative': cases.filter(Q_confirmation_negative).count()
    }


@dataset(params_schema=params_schema)
def count_staging(request: Request, params: Dict[str, str]) -> Dict[str, int]:
    cases = get_cases_filtered(request, params).filter(Q_staging)
    return {
        'total': cases.count(),
        'stage1': cases.filter(Q_staging_stage1).count(),
        'stage2': cases.filter(Q_staging_stage2).count()
    }


@dataset(params_schema=params_schema)
def campaign_meta(request: Request, params: Dict[str, str]) -> Dict[str, Union[str, int]]:
    cases = get_cases_filtered(request, params)
    return {
        'startdate': cases.aggregate(Min('document_date'))['document_date__min'],
        'enddate': cases.aggregate(Max('document_date'))['document_date__max'],
        'as_visited': cases.values('ZS', 'AS').distinct().count(),
        'villages_visited': cases.values('ZS', 'AS', 'village').distinct().count()
    }


@dataset(params_schema=params_schema)
def tested_per_day(request: Request, params: Dict[str, str]) -> List[Dict[str, int]]:
    cases = get_cases_filtered(request, params)
    tested = cases.filter(Q_screening | Q_confirmation | Q_staging) \
                  .values('document_date_day') \
                  .annotate(count=Count('document_id')) \
                  .order_by('document_date_day')
    # order_by is needed to remove 'document_date' from the GROUP BY statement
    # see comment on https://jira.ehealthafrica.org/browse/HAT-262

    date_month = params.get('date_month', None)
    if date_month is None or date_month == '':
        raise ValidationError('Dataset requires date_month query string parameter')

    # Generate a result list that includes every day in the month.
    # Otherwise the list would only contain the days that have data.
    (year, month) = [int(x) for x in date_month.split('-')]
    (_, num_days) = monthrange(year, month)
    result = [{'count': 0, 'day': i+1} for i in range(num_days)]
    for t in tested:
        day = t['document_date_day'].day
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
def population_coverage(request: Request, params: Dict[str, str]) -> Dict[str, Any]:
    (date_from, date_to) = parse_date_range(params)

    sql_context: Dict[str, Any] = {
        'date_from': date_from,
        'date_to': date_to
    }
    restrict_to_zs = request.user.profile.restrict_to_zs
    if restrict_to_zs:
        sql_context['zone_sante'] = restrict_to_zs
    elif 'location' in params:
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
def cases_over_time(request: Request, params: Dict[str, str]) -> List[Dict[str, Any]]:
    (date_from, date_to) = parse_date_range(params)

    sql_context = {
        **test_results,
        'date_from': date_from,
        'date_to': date_to,
        'date_interval': '1 days',
        'date_trunc_to': 'day',
    }
    restrict_to_zs = request.user.profile.restrict_to_zs
    if restrict_to_zs:
        sql_context['zone_sante'] = restrict_to_zs
    elif 'location' in params:
        sql_context['zone_sante'] = params['location']

    if 'source' in params:
        sql_context['source'] = params['source']

    sql = stats_queries.cases_over_time(**sql_context)

    with connection.cursor() as cursor:
        cursor.execute(sql)
        columns = [col[0] for col in cursor.description]
        # convert the row tuple to dicts
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


@dataset(params_schema={
    'type': 'object',
    'properties': {
        'location': {'type': 'string'},
        'caseyears': {'type': 'string'},
    }
})
def data_by_location(request: Request, params: Dict[str, str]) -> List[Dict[str, Any]]:
    '''
    View to list and retrieve the official list of villages
    with their meaningful info like confirmed cases, screened people...
    '''

    # first expected date is 2000-01-01
    (date_from, date_to) = parse_date_range(params, datetime(2000, 1, 1))

    sql_context: Dict[str, Any] = {
        **test_results,
    }

    restrict_to_zs = request.user.profile.restrict_to_zs
    if restrict_to_zs:
        sql_context['zones_sante'] = [restrict_to_zs.lower()]
    elif 'location' in params:
        sql_context['zones_sante'] = params['location'].lower().split(',')

    if 'caseyears' in params:
        sql_context['caseyears'] = params['caseyears'].split(',')

    sql = microplanning_queries.data_by_location(**sql_context)

    with connection.cursor() as cursor:
        cursor.execute(sql)
        columns = [col[0] for col in cursor.description]
        # convert the row tuple to dicts to dicts
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


@dataset(params_schema={
    'type': 'object',
    'properties': {},
})
def locations_with_shape(request: Request, params: Dict[str, str]) -> List[str]:
    '''
    Retrives the valid list of Zones de Sante in the `location` table.
    Those zones come from the dbf files so we can assume that their
    shapes are contained in the `shapes.json` file.
    '''

    locations = Location.objects.order_by('ZS')
    restrict_to_zs = request.user.profile.restrict_to_zs
    if restrict_to_zs:
        locations = locations.filter(ZS=restrict_to_zs)

    return locations.values_list('ZS', flat=True).distinct()


class DatasetViewSet(viewsets.ViewSet):
    '''
    View to list and retrieve registered datasets
    '''
    def list(self, request: Request) -> Response:
        items = []
        for k, v in datasets.items():
            items.append({
                'name': k,
                'url': reverse('api:datasets-detail', args=[k], request=request),
                'params_schema': v['params_schema']
            })
        return Response(items)

    def retrieve(self, request: Request, pk: str) -> Response:
        if pk not in datasets:
            raise NotFound()
        item = datasets[pk]
        # We have to convert the query dict to a regular dict, because the json schema validation
        # might mutate the params dict with default values.
        params = dict(request.GET.items())
        if not item['params_schema'] is None:
            DefaultValidator(item['params_schema']).validate(params)
        return Response(item['getter'](request, params))
