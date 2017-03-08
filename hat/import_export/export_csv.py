from datetime import timedelta
from django.conf import settings

from hat.common.utils import run_cmd, create_shared_filename
from hat.cases.filters import resolve_dateperiod

from hat.queries import export_queries
from .mapping import ANON_EXPORT_FIELDS, FULL_EXPORT_FIELDS, \
    SUSPECT_FULL_EXPORT_FIELDS, SUSPECT_ANON_EXPORT_FIELDS


def export_csv(
        anon=False,
        date_from=None,
        date_to=None,
        dateperiod=None,  # takes precedence over individual dates
        sources=None,
        location=None,
        only_suspects=False,
        sep=','
) -> str:
    if dateperiod is not None:
        (date_from, date_to) = resolve_dateperiod(dateperiod)

    filename = create_shared_filename('.csv')
    sql_context = {
        'filename': filename,
        'only_suspects': only_suspects,
        'delimiter': sep
    }
    if only_suspects:
        fields = SUSPECT_ANON_EXPORT_FIELDS if anon else SUSPECT_FULL_EXPORT_FIELDS
    else:
        fields = ANON_EXPORT_FIELDS if anon else FULL_EXPORT_FIELDS

    # quote the fields
    sql_context['fields'] = ['"{}"'.format(f) for f in fields]

    if date_from:
        sql_context['date_from'] = date_from
    if date_to:
        sql_context['date_to'] = date_to + timedelta(days=1)
    if sources:
        sql_context['sources'] = ["'{}'".format(s) for s in sources]
    if location:
        sql_context['ZS'] = location

    sql = export_queries.export_cases(**sql_context)

    db_name = settings.DB_NAME
    if settings.TESTING:
        db_name = 'test_' + db_name

    run_cmd(['psql',
             '-v', 'ON_ERROR_STOP=1',
             '-h', settings.DB_HOST,
             '-p', str(settings.DB_PORT),
             '-U', settings.DB_USERNAME,
             '-d', db_name],
            input=bytes(sql, 'UTF8'),
            env={'PGPASSWORD': settings.DB_PASSWORD or ''})
    return filename
