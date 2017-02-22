from django.db import connection


TEST_DATA = {
    'historic': {
        'file': 'testdata/HAT-Historical-Data-Forms-TEST-v1.mdb',
        'count': 6
    },
    'pv': {
        'file': 'testdata/PNLTHA_pharmacovigilance.mdb',
        'count': 1
    },
    'mobile_backup': {
        'file': 'testdata/backup-v5.enc',
        'count': 4
    },
    'mobile_backup_duplicates_1': {
        'file': 'testdata/backup-v5-duplicate-test-pt1.backup.enc',
        'count': 1
    },
    'mobile_backup_duplicates_2': {
        'file': 'testdata/backup-v5-duplicate-test-pt2.backup.enc',
        'count': 2  # 2 of the same, with different test results
    },
    'mobile_backup_duplicates_3': {
        'file': 'testdata/backup-v5-duplicate-test-pt3.backup.enc',
        'count': 3  # 3 of the same with different test results
    },
    # skip duplicate test files for total count
    'total_count': 11
}


#
# Helper functions
#


def get_events():
    with connection.cursor() as cursor:
        cursor.execute('SELECT * FROM hat_event_view')
        columns = [col[0] for col in cursor.description]
        events = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return events


def get_import_cases_file_event(id):
    with connection.cursor() as cursor:
        cursor.execute('SELECT * FROM hat_import_cases_file_event WHERE id = %s', [id])
        columns = [col[0] for col in cursor.description]
        return dict(zip(columns, cursor.fetchone()))
