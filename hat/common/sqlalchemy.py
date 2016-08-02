import sys
from sqlalchemy import create_engine
from django.conf import settings


def create_sqlengine():
    db = settings.DATABASES['default']
    userpass = db['USER'] + ((':' + db['PASSWORD']) if db['PASSWORD'] else '')
    name = db['NAME']

    # During testing django prefixes the db name with 'test_'.
    if 'test' in sys.argv:
        name = 'test_' + name

    pg = 'postgresql+psycopg2://{}@{}:{}/{}'.format(
        userpass, db['HOST'], db['PORT'], name
    )
    return create_engine(pg)


engine = create_sqlengine()
