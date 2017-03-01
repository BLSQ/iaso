import os
from django.db import connection
from snaql.factory import Snaql

current_dir = os.path.abspath(os.path.dirname(__file__))
snaql_factory = Snaql(current_dir, '.')

# api
stats_queries = snaql_factory.load_queries('stats.sql')
microplanning_queries = snaql_factory.load_queries('microplanning.sql')

# cases
duplicates_queries = snaql_factory.load_queries('duplicates.sql')
prepare_queries = snaql_factory.load_queries('prepare_db.sql')
event_log_queries = snaql_factory.load_queries('event_log.sql')

migration1 = snaql_factory.load_queries('migration_0001.sql')

# export
export_queries = snaql_factory.load_queries('export.sql')


def prepare_db():
    with connection.cursor() as cursor:
        cursor.execute(prepare_queries.prepare_views())
        cursor.execute(duplicates_queries.prepare())
