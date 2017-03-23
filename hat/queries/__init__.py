import os
from django.db import connection
from snaql.factory import Snaql
from hat.import_export.mapping import ResultValues

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
migration2 = snaql_factory.load_queries('migration_0002.sql')

# export
export_queries = snaql_factory.load_queries('export.sql')

result_values = {name: member.value for (name, member) in ResultValues.__members__.items()}


def prepare_premigration() -> None:
    with connection.cursor() as cursor:
        cursor.execute(prepare_queries.run_premigration())


def prepare_postmigration() -> None:
    with connection.cursor() as cursor:
        cursor.execute(prepare_queries.run_postmigration(**result_values))
        cursor.execute(duplicates_queries.prepare())
