from pandas import DataFrame
from hat.cases.models import Case
from .extract_transform import ANON_EXPORT_FIELDS, FULL_EXPORT_FIELDS

DATE_FORMAT = '%Y-%m-%d %H:%M:%S'


def export_csv(
        anon=False,
        start_date=None,
        end_date=None,
        sources=None,
        sep=','
) -> str:
    filters = {}
    if start_date:
        filters['document_date__gte'] = start_date
    if end_date:
        filters['document_date__lte'] = end_date
    if sources:
        filters['source__in'] = sources

    qs = Case.objects.filter(**filters).order_by('document_date')
    df = DataFrame(list(qs.values()))

    if len(df):
        columns = ANON_EXPORT_FIELDS if anon else FULL_EXPORT_FIELDS
        return df.to_csv(index=False, columns=columns, sep=sep, date_format=DATE_FORMAT)
    else:
        return ''
