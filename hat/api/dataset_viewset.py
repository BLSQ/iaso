from functools import wraps
from django.db.models import Q, Count, Min, Max
from django.db.models.expressions import RawSQL
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound
from hat.cases.models import Case
from hat.common.jsonschema_validator import DefaultValidator


SCREENING_FIELDS = [
    "test_rdt",
    "test_catt",
]

CONFIRMATION_FIELDS = [
    "test_maect",
    "test_ge",
    "test_pg",
    "test_ctcwoo",
    "test_pl",
]

Q_screening = Q()
for field in SCREENING_FIELDS:
    Q_screening |= Q(**{field + '__isnull': False})

Q_screening_positive = Q()
for field in SCREENING_FIELDS:
    Q_screening_positive |= Q(**{field: True})

Q_confirmation = Q()
for field in CONFIRMATION_FIELDS:
    Q_confirmation |= Q(**{field + '__isnull': False})

Q_confirmation_positive = Q()
for field in CONFIRMATION_FIELDS:
    Q_confirmation_positive |= Q(**{field: True})

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


@dataset()
def count_total(params):
    cases = Case.objects.all()
    tested = cases.filter(Q_screening | Q_confirmation)
    return {'registered': cases.count(),
            'tested': tested.count(),
            'male': tested.filter(sex='male').count(),
            'female': tested.filter(sex='female').count()}


@dataset()
def count_screened(params):
    cases = Case.objects.filter(Q_screening)
    return {'total': cases.count(),
            'positive': cases.filter(Q_screening_positive).count(),
            'negative': cases.exclude(Q_screening_positive).count()}


@dataset()
def count_confirmed(params):
    cases = Case.objects.filter(Q_confirmation)
    return {'total': cases.count(),
            'positive': cases.filter(Q_confirmation_positive).count(),
            'negative': cases.exclude(Q_confirmation_positive).count()}


@dataset()
def campaign_meta(params):
    cases = Case.objects.all()
    return {'startdate': cases.aggregate(Min('document_date'))['document_date__min'],
            'enddate': cases.aggregate(Max('document_date'))['document_date__max'],
            'az_visited': cases.values('AZ').distinct().count(),
            'villages_visited': cases.values('village').distinct().count()}


@dataset(params_schema={
    'type': 'object',
    'properties': {
        'date_trunc': {'enum': ['year', 'month', 'day'], 'default': 'month'},
    },
    'additionalProperties': False,
})
def list_screened(params):
    # We want to group by some part of the date and get a count of records that match the
    # filter. For that we select on the date truncated by postgres `date_trunc` function to
    # the date precision we like to group on.
    # `RawSQL` is used, because we call the Postgres builtin `date_trunc` function.
    return Case.objects \
               .filter(Q_screening) \
               .annotate(date=RawSQL('date_trunc(%s, document_date)', (params['date_trunc'],))) \
               .values('date') \
               .annotate(count=Count('document_id'))


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
            # validate(params, params_schema)
            DefaultValidator(item['params_schema']).validate(params)
        return Response(item['getter'](params))
