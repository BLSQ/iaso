from hat.couchdb import api
import re

db_name_test = re.compile('^device_test_')


def clean_couch():
    '''
    Cleans up all the CouchDB users starting with test_
    and all the databases starting with device_test
    '''
    testusers = api \
        .get('_users/_all_docs?' +
             'startkey="org.couchdb.user:test_"' +
             '&endkey="org.couchdb.user:test_%7B%7D"') \
        .json()
    for user in testusers['rows']:
        api.delete('_users/{}?rev={}'.format(user['id'], user['value']['rev']))

    # deleteing all the test dbs
    testdbs = filter(db_name_test.match, api.get('_all_dbs').json())
    for db in testdbs:
        api.delete(db)
