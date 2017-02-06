import os
from snaql.factory import Snaql

current_dir = os.path.abspath(os.path.dirname(__file__))
snaql_factory = Snaql(current_dir, '.')

duplicates_queries = snaql_factory.load_queries('duplicates.sql')
prepare_queries = snaql_factory.load_queries('prepare_db.sql')
