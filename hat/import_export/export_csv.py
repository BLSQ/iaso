from pandas import DataFrame
from hat.cases.models import Case
from .extract_transform import ANON_EXPORT_FIELDS, FULL_EXPORT_FIELDS
from hat.cases.filters import resolve_dateperiod, Q_confirmation, Q_screening_positive

DATE_FORMAT = '%Y-%m-%d %H:%M:%S'


def export_csv(
        anon=False,
        start_date=None,
        end_date=None,
        dateperiod=None,
        sources=None,
        location=None,
        only_suspects=False,
        sep=','
) -> str:
    if dateperiod is not None:
        # dateperiod overrules start_date, end_date
        (start_date, end_date) = resolve_dateperiod(dateperiod)

    filters = {}
    if start_date:
        filters['document_date__gte'] = start_date
    if end_date:
        filters['document_date__lte'] = end_date
    if sources:
        filters['source__in'] = sources
    if location:
        filters['ZS'] = location

    qs = Case.objects.filter(**filters).order_by('document_date')

    if only_suspects:
        qs = qs.filter(Q_screening_positive) \
               .exclude(Q_confirmation)

    df = DataFrame(list(qs.values()))

    if len(df):
        columns = ANON_EXPORT_FIELDS if anon else FULL_EXPORT_FIELDS
        return df.to_csv(index=False, columns=columns, sep=sep, date_format=DATE_FORMAT)
    else:
        return ''
