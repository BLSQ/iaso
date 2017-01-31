from django.db import connection
from django_rq import job
from hat.cases.queries import duplicates_queries


@job('default', timeout=15*60)
def duplicates_task():
    with connection.cursor() as cursor:
        cursor.execute(duplicates_queries.makepairs())
