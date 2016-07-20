from sqlalchemy import create_engine
from django.conf import settings


def create_sqlengine():
    db = settings.DATABASES['default']
    userpass = db['USER'] + ((':' + db['PASSWORD']) if db['PASSWORD'] else '')
    pg = 'postgresql+psycopg2://{}@{}:{}/{}'.format(
        userpass, db['HOST'], db['PORT'], db['NAME']
    )
    return create_engine(pg)


engine = create_sqlengine()
