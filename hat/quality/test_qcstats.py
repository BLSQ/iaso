from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase


class CasesTest(APITestCase):
    fixtures = ['locations', 'users', 'patients', 'cases', 'provinces', 'qc']

    ###
    # General tests
    def test_qcstats_level30_screener(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))
        url = reverse('teststats-list') + "?grouping=tester&testertype=screener&from=2017-11-11&to=2019-10-30&" \
                                        "order=tester__user__last_name&level=coordination&order=" \
                                        "tester__user__last_name&limit=1&page=1"
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        total = response.data["total"]
        result = response.data["result"]
        self.assertEquals(result.count(), 1, "Only one screener")
        self.assertEquals(
            result.first(),
            {'tester_id': 11, 'tester__user__last_name': 'Ner', 'tester__user__first_name': 'Scree',
             'tester__team__coordination__name': None, 'test_count': 9, 'catt_count': 7, 'rdt_count': 2,
             'screening_count': 9,
             'pg_count': 0, 'pg_count_positive': 0, 'ctcwoo_count': 0, 'ctcwoo_count_positive': 0, 'maect_count': 0,
             'maect_count_positive': 0, 'pl_count': 0, 'pl_count_positive': 0, 'pl_count_stage1': 0,
             'pl_count_stage2': 0,
             'confirmation_count': 0, 'positive_catt_count': 7, 'positive_rdt_count': 2, 'negative_catt_count': 0,
             'negative_rdt_count': 0, 'positive_screening_test_count': 9, 'positive_confirmation_test_count': 0,
             'is_clear': 0, 'is_good_place': 0, 'total_population': 1004, 'rdt_test_pictures': 2, 'test_pictures': 9,
             'rdt_test_positive_pictures': 2, 'rdt_test_negative_pictures': 0, 'catt_test_pictures': 7,
             'catt_test_positive_pictures': 7, 'catt_test_negative_pictures': 0, 'checked': 6, 'checked_ok': 4,
             'checked_ko': 2, 'checked_ok_central': 0, 'checked_ko_central': 3, 'checked_mismatch': 2,
             'checked_unreadable': 0, 'checked_invalid': 0}
        )
        self.assertEqual(
            total,
            {'total_count': 6, 'total_confirmation_tests': 0, 'total_confirmation_tests_positive': 0, 'total_catt': 5,
             'total_catt_positive': 5, 'total_rdt': 1, 'total_rdt_positive': 1, 'total_pg': 0, 'total_ctc': 0,
             'total_maect': 0, 'total_pl': 0, 'total_pl_stage1': 0, 'total_pl_stage2': 0}
        )

    def test_qcstats_level40_confirmer(self):
        self.assertTrue(self.client.login(username='qc_admin', password='supervisorsupervisor'))
        url = reverse('teststats-list') + "?grouping=tester&testertype=confirmer&from=2017-11-11&to=2019-10-30&" \
                                        "order=tester__user__last_name&level=central&order=" \
                                        "tester__user__last_name&limit=1&page=1"
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        total = response.data["total"]
        result = response.data["result"]
        self.assertEquals(result.count(), 2, "Two confirmers")
        self.assertEquals(
            result.first(),
            {'tester_id': 10, 'tester__user__last_name': '', 'tester__user__first_name': '',
             'tester__team__coordination__name': None, 'test_count': 1, 'catt_count': 0, 'rdt_count': 0,
             'screening_count': 0, 'pg_count': 1, 'pg_count_positive': 0, 'ctcwoo_count': 0, 'ctcwoo_count_positive': 0,
             'maect_count': 0, 'maect_count_positive': 0, 'pl_count': 0, 'pl_count_positive': 0, 'pl_count_stage1': 0,
             'pl_count_stage2': 0, 'confirmation_count': 1, 'positive_catt_count': 0, 'positive_rdt_count': 0,
             'negative_catt_count': 0, 'negative_rdt_count': 0, 'positive_screening_test_count': 0,
             'positive_confirmation_test_count': 0, 'is_clear': 0, 'is_good_place': 0, 'total_population': 1004,
             'confirmation_video_count': 1, 'confirmation_positive_video_count': 0, 'checked': 0, 'checked_ok': 0,
             'checked_ko': 0, 'checked_ok_central': 0, 'checked_ko_central': 0, 'checked_mismatch': 0,
             'checked_unreadable': 0, 'checked_invalid': 0}
        )
        self.assertEquals(
            result.last(),
            {'tester_id': 12, 'tester__user__last_name': 'Firmer', 'tester__user__first_name': 'Con',
             'tester__team__coordination__name': None, 'test_count': 6, 'catt_count': 0, 'rdt_count': 0,
             'screening_count': 0, 'pg_count': 6, 'pg_count_positive': 5, 'ctcwoo_count': 0, 'ctcwoo_count_positive': 0,
             'maect_count': 0, 'maect_count_positive': 0, 'pl_count': 0, 'pl_count_positive': 0, 'pl_count_stage1': 0,
             'pl_count_stage2': 0, 'confirmation_count': 6, 'positive_catt_count': 0, 'positive_rdt_count': 0,
             'negative_catt_count': 0, 'negative_rdt_count': 0, 'positive_screening_test_count': 0,
             'positive_confirmation_test_count': 5, 'is_clear': 4, 'is_good_place': 4, 'total_population': 1004,
             'confirmation_video_count': 6, 'confirmation_positive_video_count': 5, 'checked': 4, 'checked_ok': 3,
             'checked_ko': 1, 'checked_ok_central': 1, 'checked_ko_central': 1, 'checked_mismatch': 1,
             'checked_unreadable': 0, 'checked_invalid': 0}
        )
        self.assertEqual(
            total,
            {'total_count': 5, 'total_confirmation_tests': 5, 'total_confirmation_tests_positive': 3, 'total_catt': 0,
             'total_catt_positive': 0, 'total_rdt': 0, 'total_rdt_positive': 0, 'total_pg': 5, 'total_ctc': 0,
             'total_maect': 0, 'total_pl': 0, 'total_pl_stage1': 0, 'total_pl_stage2': 0}
        )

