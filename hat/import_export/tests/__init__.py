from ..import_cases import import_cases_file

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


def import_helper(orgname, filename):
    ''' Helper functions to bail on import errors '''
    stats = import_cases_file(orgname, filename)
    if stats['error'] is not None:
        raise Exception(stats['error']['full_message'])
    return stats
