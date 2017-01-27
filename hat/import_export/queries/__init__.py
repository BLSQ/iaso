import os
from snaql.factory import Snaql

current_dir = os.path.abspath(os.path.dirname(__file__))
snaql_factory = Snaql(current_dir, '.')

export_queries = snaql_factory.load_queries('export.sql')
