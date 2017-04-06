import os
from django.db import connection
from snaql.factory import Snaql
from hat.import_export.typing import ResultValues

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

# helpers
filters_queries = snaql_factory.load_queries('filters.sql')

sql_context = {
    # list of tests used in screening sessions
    'screening': (
        'test_catt',
        'test_rdt',
    ),

    # list of tests used to confirm the disease
    'confirmation': (
        'test_ctcwoo',
        'test_ge',
        'test_lcr',
        'test_lymph_node_puncture',
        'test_maect',
        'test_pg',
        'test_sf',
    ),

    # possible test results in order of importance
    'results': (
        result_values['positive'],  # positive
        result_values['negative'],  # negative
        result_values['missing'],  # missing
        result_values['absent'],  # absent
    ),
}


def prepare_premigration() -> None:
    with connection.cursor() as cursor:
        cursor.execute(prepare_queries.run_premigration())


def prepare_postmigration() -> None:
    with connection.cursor() as cursor:
        cursor.execute(prepare_queries.run_postmigration(**sql_context))
        #  cursor.execute(prepare_queries.prepare_views(**sql_context))
        cursor.execute(duplicates_queries.prepare())
