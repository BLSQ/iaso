from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from django.conf import settings


def create_sqlengine() -> Engine:
    db = settings.DATABASES['default']
    userpass = db['USER'] + ((':' + db['PASSWORD']) if db['PASSWORD'] else '')
    dbname = db['NAME']

    # During testing django prefixes the db name with 'test_'.
    if settings.TESTING:
        dbname = 'test_' + dbname

    pg = 'postgresql+psycopg2://{}@{}:{}/{}'.format(
        userpass, db['HOST'], db['PORT'], dbname
    )
    return create_engine(pg)


engine = create_sqlengine()
