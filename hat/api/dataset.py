'''

.. |sources| replace:: Available sources:
                       ``mobile_backup``,
                       ``mobile_sync``,
                       ``historic``,
                       ``pv``.

.. |p_date_month| replace:: Filters results by document date month.
.. |p_date_from|  replace:: Filters participants with document date after parameter value.
.. |p_date_to|    replace:: Filters participants with document date before parameter value.
.. |p_location|   replace:: Filters results by “zone de santé”.
.. |p_source|     replace:: Filters results by document source. -- |sources|

'''
from typing import Dict, Tuple, List, Any, Callable, Optional
import logging
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
from hat.sync.models import DeviceDB, DeviceEvent
from hat.common.jsonschema_validator import DefaultValidator
from hat.cases.filters import \
    Q_screening, Q_screening_positive, Q_screening_negative, \
    Q_confirmation, Q_confirmation_positive, Q_confirmation_negative, \
    Q_staging, Q_staging_stage1, Q_staging_stage2, \
    test_results
from hat.queries import stats_queries, microplanning_queries

from hat.cases.utils import create_list_from_restrict_to_zs
from hat.geo.models import AS, ZS, Village
from hat.users.models import Team

datasets = {}

DATE_FORMAT = '%Y-%m-%d'


def localize_date(date: datetime) -> datetime:
    # get rid of "naive date" warnings
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
    # Decorator to add a query function to the dataset.
    # Takes an optional schema to validate the query string parameters against.
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
        'device_id': {'type': 'string'}
    },
    'additionalProperties': False,
}


def get_cases_filtered(request: Request,
                       params: Dict[str, str],
                       ignore_params: List[str]=None) \
                       -> QuerySet:
    # Takes the requests parameters as args and returns a filtered CaseView QuerySet.
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
        restricted_zones = create_list_from_restrict_to_zs(restrict_to_zs)
        cases = cases.filter(ZS__in=restricted_zones)
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
    '''
    Retrieves the list of “zones de santé” in :class:`hat.cases.models.CaseView`.

    :param “YYYY-MM”    date_month: |p_date_month|
    :param “YYYY-MM-DD” date_from:  |p_date_from|
    :param “YYYY-MM-DD” date_to:    |p_date_to|
    :param str          source:     |p_source|

    :return: The flat list of “zones de santé”.
    :rtype:  List[str]

    '''
    cases = get_cases_filtered(request, params, ignore_params=['location'])
    return cases.order_by('ZS').values_list('ZS', flat=True).distinct()


@dataset(params_schema=params_schema)
def count_total(request: Request, params: Dict[str, str]) -> JsonType:
    '''
    Retrieves figures about participants in :class:`hat.cases.models.CaseView`.

    :param “YYYY-MM”    date_month: |p_date_month|
    :param “YYYY-MM-DD” date_from:  |p_date_from|
    :param “YYYY-MM-DD” date_to:    |p_date_to|
    :param str          source:     |p_source|
    :param str          location:   |p_location|

    :return: A dictionary with the figures.
    :rtype:  JsonType

        * ``registered`` -- Number of registered participants.
        * ``tested``     -- Number of participants with screening, confirmation or staging result.

    '''
    cases = get_cases_filtered(request, params)
    tested = cases.filter(Q_screening | Q_confirmation | Q_staging)
    return {
        'registered': cases.count(),
        'tested': tested.count()
    }


@dataset(params_schema=params_schema)
def count_screened(request: Request, params: Dict[str, str]) -> JsonType:
    '''
    Retrieves figures about screening results in :class:`hat.cases.models.CaseView`.

    :param “YYYY-MM”    date_month: |p_date_month|
    :param “YYYY-MM-DD” date_from:  |p_date_from|
    :param “YYYY-MM-DD” date_to:    |p_date_to|
    :param str          source:     |p_source|
    :param str          location:   |p_location|

    :return: A dictionary with the figures.
    :rtype:  JsonType

        * ``total``    -- Number of participants with an screening result.
        * ``positive`` -- Number of participants with a positive screening result.
        * ``negative`` -- Number of participants with a negative screening result.
        * ``missing_confirmation`` -- Number of participants with a positive screening result
          but without a confirmation result.

    '''
    cases = get_cases_filtered(request, params).filter(Q_screening)
    return {
        'total': cases.count(),
        'positive': cases.filter(Q_screening_positive).count(),
        'negative': cases.filter(Q_screening_negative).count(),
        'missing_confirmation': cases.filter(Q_screening_positive)
                                     .exclude(Q_confirmation).count()
    }


@dataset(params_schema=params_schema)
def count_confirmed(request: Request, params: Dict[str, str]) -> JsonType:
    '''
    Retrieves figures about confirmation results in :class:`hat.cases.models.CaseView`.

    :param “YYYY-MM”    date_month: |p_date_month|
    :param “YYYY-MM-DD” date_from:  |p_date_from|
    :param “YYYY-MM-DD” date_to:    |p_date_to|
    :param str          source:     |p_source|
    :param str          location:   |p_location|

    :return: A dictionary with the figures.
    :rtype:  JsonType

        * ``total``    -- Number of participants with a confirmation result.
        * ``positive`` -- Number of participants with a positive confirmation result.
        * ``negative`` -- Number of participants with a negative confirmation result.

    '''
    cases = get_cases_filtered(request, params).filter(Q_confirmation)
    return {
        'total': cases.count(),
        'positive': cases.filter(Q_confirmation_positive).count(),
        'negative': cases.filter(Q_confirmation_negative).count()
    }


@dataset(params_schema=params_schema)
def count_staging(request: Request, params: Dict[str, str]) -> JsonType:
    '''
    Retrieves figures about staging results in :class:`hat.cases.models.CaseView`.

    :param “YYYY-MM”    date_month: |p_date_month|
    :param “YYYY-MM-DD” date_from:  |p_date_from|
    :param “YYYY-MM-DD” date_to:    |p_date_to|
    :param str          source:     |p_source|
    :param str          location:   |p_location|

    :return: A dictionary with the figures.
    :rtype:  JsonType

        * ``total``  -- Number of participants with an staging result.
        * ``stage1`` -- Number of participants with an “Stage 1” result.
        * ``stage2`` -- Number of participants with an “Stage 2” result.

    '''
    cases = get_cases_filtered(request, params).filter(Q_staging)
    return {
        'total': cases.count(),
        'stage1': cases.filter(Q_staging_stage1).count(),
        'stage2': cases.filter(Q_staging_stage2).count()
    }


@dataset(params_schema=params_schema)
def campaign_meta(request: Request, params: Dict[str, str]) -> JsonType:
    '''
    Retrieves screening sessions data in :class:`hat.cases.models.CaseView`.

    :param “YYYY-MM”    date_month: |p_date_month|
    :param “YYYY-MM-DD” date_from:  |p_date_from|
    :param “YYYY-MM-DD” date_to:    |p_date_to|
    :param str          source:     |p_source|
    :param str          location:   |p_location|

    :return: A dictionary with the figures.
    :rtype:  JsonType

        * ``startdate``        -- First date with screening sessions.
        * ``enddate``          -- Last date with screening sessions.
        * ``as_visited``       -- Number of visited “aires de santé”.
        * ``villages_visited`` -- Number of visited villages.

    '''
    cases = get_cases_filtered(request, params)
    return {
        'startdate': cases.aggregate(Min('document_date'))['document_date__min'],
        'enddate': cases.aggregate(Max('document_date'))['document_date__max'],
        'as_visited': cases.values('ZS', 'AS').distinct().count(),
        'villages_visited': cases.values('ZS', 'AS', 'village').distinct().count()
    }


@dataset(params_schema=params_schema)
def device_status(request: Request, params: Dict[str, str]) -> List[JsonType]:
    devices = DeviceDB.objects.order_by("-last_synced_date").order_by('last_synced_date')

    res = []
    for device in devices:
        event = DeviceEvent.objects.filter(device=device, event_type=DeviceEvent.STATUS_CHANGE).order_by('date').last()
        status_label = None,
        if event:
            status_label = event.status.label
        last_team = ''
        last_user = ''
        if device.last_user and device.last_user.profile:
            last_user = device.last_user.profile.full_name()
            if device.last_user.profile.team:
                last_team = device.last_user.profile.team.name

        device_dict = {
                   'last_synced_date': device.last_synced_date,
                   'last_synced_log_message': device.last_synced_log_message,
                   'device_id': device.device_id,
                   'days_since_sync': device.days_since_sync(),
                   'last_status': status_label,
                   'last_user': last_user,
                   'last_team': last_team,
                   'id': device.id

        }
        res.append(device_dict)
    return res


@dataset(params_schema=params_schema)
def device_events(request: Request, params: Dict[str, str]) -> List[JsonType]:
    device_id = params.get('device_id', None)
    return DeviceEvent.objects\
        .filter(device_id=device_id)\
        .order_by('-date')\
        .values('date', 'status__label', 'event_type', 'comment', 'reporter__username', 'action__label')[:6]


@dataset(params_schema=params_schema)
def tested_per_day(request: Request, params: Dict[str, str]) -> List[JsonType]:
    '''
    Retrieves the number of participants per day of the month
    in :class:`hat.cases.models.CaseView`.

    :param “YYYY-MM”    date_month: |p_date_month|
    :param “YYYY-MM-DD” date_from:  |p_date_from|
    :param “YYYY-MM-DD” date_to:    |p_date_to|
    :param str          source:     |p_source|
    :param str          location:   |p_location|

    :return: A list with the figures.
    :rtype:  List[JsonType]

        * ``day``   -- Day of the month.
        * ``count`` -- Number of participants with a screening, confirmation or staging result.

    :raises ValidationError: if parameter **date_month** is missing.

    '''
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
def population_coverage(request: Request, params: Dict[str, str]) -> JsonType:
    '''
    Retrieves the figures of visited villages with population data
    joining :class:`hat.cases.models.CaseView` and :class:`hat.cases.models.Location`.

    :param “YYYY-MM-DD” date_from:  |p_date_from|
    :param “YYYY-MM-DD” date_to:    |p_date_to|
    :param str          location:   |p_location|

    :return: a dictionary with the figures.
    :rtype:  JsonType

        * ``total_visited``              -- Number of visited villages.
        * ``visited_with_population``    -- Number of visited villages with population data.
        * ``registered_with_population``
          -- Number of participants in villages with population data.
        * ``population``                 -- Total population.

    '''
    (date_from, date_to) = parse_date_range(params)

    sql_context: JsonType = {
        'date_from': date_from,
        'date_to': date_to
    }
    restrict_to_zs = request.user.profile.restrict_to_zs
    if restrict_to_zs:
        restricted_zones = create_list_from_restrict_to_zs(restrict_to_zs)
        sql_context['zones_sante'] = restricted_zones
    elif 'location' in params:
        sql_context['zones_sante'] = [params['location']]

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
def cases_over_time(request: Request, params: Dict[str, str]) -> List[JsonType]:
    '''
    Retrieves the cases figures over time in :class:`hat.cases.models.CaseView`.

    :param “YYYY-MM”    date_month: |p_date_month|
    :param “YYYY-MM-DD” date_from:  |p_date_from|
    :param “YYYY-MM-DD” date_to:    |p_date_to|
    :param str          source:     |p_source|
    :param str          location:   |p_location|

    :return: a list with the figures.
    :rtype:  List[JsonType]

        * ``date``               -- Document date.
        * ``registered_total``   -- Number of participants.
        * ``screening_total``    -- Number of participants with an screening result.
        * ``screening_pos``      -- Number of participants with a positive screening result.
        * ``screening_neg``      -- Number of participants with a negative screening result.
        * ``confirmation_total`` -- Number of participants with a confirmation result.
        * ``confirmation_pos``   -- Number of participants with a positive confirmation result.
        * ``confirmation_neg``   -- Number of participants with a negative confirmation result.
        * ``staging_total``      -- Number of participants with an staging result.
        * ``stage1``             -- Number of participants with an “Stage 1” result.
        * ``stage2``             -- Number of participants with an “Stage 2” result.

    '''
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
        restricted_zones = create_list_from_restrict_to_zs(restrict_to_zs)
        sql_context['zones_sante'] = restricted_zones
    elif 'location' in params:
        sql_context['zones_sante'] = [params['location']]

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
def data_by_location(request: Request, params: Dict[str, str]) -> List[JsonType]:
    '''
    Retrieves the official list of villages (:class:`hat.cases.models.Location`)
    with their last HAT case data (:class:`hat.cases.models.CaseView`) if requested.

    .. |c|  replace:: Only available with ``caseyears`` parameter.
    .. |c2| replace:: Includes HAT cases figures if the village last HAT case
                      was confirmed in these years.

    :param List[str] location:  Filters villages by “zones de santé”.
    :param List[int] caseyears: |c2|

    :return: A list with the villages data.
    :rtype:  List[JsonType]

        * ``province``       -- Current official province.
        * ``formerProvince`` -- Former province.
        * ``ZS``             -- Zone de santé.
        * ``AS``             -- Aire de santé.
        * ``village``        -- Official village name.
        * ``longitude``      -- Coordinates: longitude.
        * ``latitude``       -- Coordinates: latitude.
        * ``gpsSource``      -- GPS source: organization that provided GPS coordinates.
        * ``id``             -- Calculated id used to plot the village in the map.
        * ``label``          -- Village label used in the map.
        * ``type``           -- Village classification.
            - ``official``: from “zone de santé”.
            - ``other``:    not from “zone de santé”.
            - ``unknown``:  visible from satellite.
        * ``population`` -- Village population, only ``official`` villages have population data.
        * ``populationYear``   -- Year in which the census was taken.
        * ``populationSource`` -- Name of the organization that provided population data.
        * ``lastConfirmedCaseYear`` -- The last year in which a HAT case was confirmed. |c|
        * ``lastConfirmedCaseDate`` -- The date in which the last HAT case was confirmed. |c|
        * ``confirmedCases``        -- Number of HAT cases in that last year. |c|

    '''

    sql_context: JsonType = {
        **test_results,
    }

    restrict_to_zs = request.user.profile.restrict_to_zs
    if restrict_to_zs:
        restricted_zones = create_list_from_restrict_to_zs(restrict_to_zs)
        sql_context['zones_sante'] = ','.join(restricted_zones).lower().split(',')
    elif 'location' in params:
        sql_context['zones_sante'] = params['location'].lower().split(',')

    if 'caseyears' in params:
        sql_context['caseyears'] = params['caseyears'].split(',')

    sql = microplanning_queries.data_by_location(**sql_context)
    print(sql)
    logger = logging.getLogger(__name__)
    logger.error(sql)
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
    Retrieves the valid list of “zones de santé” (:class:`hat.cases.models.Location`).
    Those zones come from the dbf files so we can assume that their
    shapes are contained in the ``shapes.json`` file.

    :return: The flat list of “zones de santé”.
    :rtype:  List[str]
    '''

    locations = Location.objects.order_by('ZS')
    restrict_to_zs = request.user.profile.restrict_to_zs
    if restrict_to_zs:
        restricted_zones = create_list_from_restrict_to_zs(restrict_to_zs)
        locations = locations.filter(ZS__in=restricted_zones)

    return locations.values_list('ZS', flat=True).distinct()

@dataset(params_schema={
    'type': 'object',
    'properties': {
        'province_id': {'type': 'string'},
    },
})
def health_zones(request: Request, params: Dict[str, str]) -> List[str]:
    province_id = params.get("province_id")

    if province_id:
        queryset = ZS.objects.filter(province_id=province_id)
    else:
        queryset = ZS.objects.all()

    return queryset.values_list('id', 'name').order_by('name')

@dataset(params_schema={
    'type': 'object',
    'properties': {
        'zs_id': {'type': 'string'},
    },
})
def health_areas(request: Request, params: Dict[str, str]) -> List[str]:
    zs_ids = params.get("zs_id")

    if zs_ids:
        queryset = AS.objects.filter(ZS_id__in=zs_ids.split(','))
    else:
        queryset = AS.objects.all()

    return queryset.values_list('id', 'name').order_by('name')

@dataset(params_schema={
    'type': 'object',
    'properties': {
        'as_id': {'type': 'string'},
    },
})

def villages(request: Request, params: Dict[str, str]) -> List[str]:
    as_id = params.get("as_id")

    if as_id:
        queryset = Village.objects.filter(as_id=as_id)
    else:
        queryset = Village.objects.all()

    return queryset.values_list('id', 'name').order_by('name')



class DatasetViewSet(viewsets.ViewSet):
    # View to list and retrieve registered datasets
    def list(self, request: Request) -> Response:
        items = []
        for k, v in datasets.items():
            items.append({
                'name': k,
                'url': reverse('datasets-detail', args=[k], request=request),
                'params_schema': v['params_schema']
            })
        return Response(items)

    def retrieve(self, request: Request, pk: str) -> Response:
        if pk not in datasets:
            raise NotFound()
        item = datasets[pk]
        # We have to convert the query dict to a regular dict,
        # because the json schema validation
        # might mutate the params dict with default values.
        params = dict(request.GET.items())
        if not item['params_schema'] is None:
            DefaultValidator(item['params_schema']).validate(params)
        return Response(item['getter'](request, params))  # type: ignore
