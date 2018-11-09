import os
from django.db import connection
from snaql.factory import Snaql

from hat.cases.filters import screening_tests, confirmation_tests, test_values_in_order

current_dir = os.path.abspath(os.path.dirname(__file__))
snaql_factory = Snaql(current_dir, '.')

# cases
prepare_queries = snaql_factory.load_queries('prepare_db.sql')
event_log_queries = snaql_factory.load_queries('event_log.sql')

migration1 = snaql_factory.load_queries('migration_0001.sql')

# export
export_queries = snaql_factory.load_queries('export.sql')

sql_context = {
    # list of tests used in screening sessions
    'screening': screening_tests,
    # list of tests used to confirm the disease
    'confirmation': confirmation_tests,
    # list of test values in order of importance
    'results': test_values_in_order,
}


def prepare_premigration() -> None:
    with connection.cursor() as cursor:
        cursor.execute(prepare_queries.run_premigration())


def prepare_postmigration() -> None:
    with connection.cursor() as cursor:
        cursor.execute(prepare_queries.run_postmigration(**sql_context))
