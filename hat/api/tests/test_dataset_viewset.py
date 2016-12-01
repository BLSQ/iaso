from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import datetime


class DatasetTests(APITestCase):
    fixtures = ['users', 'cases', 'locations']

    def setUp(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))

    def test_list_datasets(self):
        url = reverse('api:datasets-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 10)

    def test_count_total(self):
        url = reverse('api:datasets-detail', args=['count_total'])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'registered': 6, 'tested': 5})

    def test_count_screened(self):
        url = reverse('api:datasets-detail', args=['count_screened'])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {'negative': 1, 'positive': 2, 'total': 3, 'missing_confirmation': 1})

    def test_count_confirmed(self):
        url = reverse('api:datasets-detail', args=['count_confirmed'])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'negative': 1, 'positive': 2, 'total': 3})

    def test_count_staging(self):
        url = reverse('api:datasets-detail', args=['count_staging'])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'stage1': 1, 'stage2': 0, 'total': 1})

    def test_campaign_meta(self):
        url = reverse('api:datasets-detail', args=['campaign_meta'])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['az_visited'], 2)
        self.assertEqual(response.data['villages_visited'], 3)
        self.assertEqual(
            response.data['startdate'].replace(tzinfo=None),
            datetime(2016, 1, 1, 0, 0)
        )
        self.assertEqual(
            response.data['enddate'].replace(tzinfo=None),
            datetime(2016, 1, 6, 0, 0)
        )

    def test_tested_per_day(self):
        url = '{}?date=2016-01'.format(
            reverse('api:datasets-detail', args=['tested_per_day']))
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 31)
        self.assertEqual(response.data[1]['count'], 2)

    def test_population_coverage(self):
        url = '{}?datefrom=2016-01-01&dateto=2016-12-01'.format(
            reverse('api:datasets-detail', args=['population_coverage']))
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(data['population'], 15)
        self.assertEqual(data['registered_with_population'], 5)
        self.assertEqual(data['visited_with_population'], 2)
        self.assertEqual(data['total_visited'], 3)

    def test_cases_over_time(self):
        url = '{}?datefrom=2016-01-01&dateto=2016-01-31'.format(
            reverse('api:datasets-detail', args=['cases_over_time']))
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(data[0]['registered_total'], 1)
        self.assertEqual(data[0]['screening_total'], 0)
        self.assertEqual(data[0]['confirmation_total'], 0)
        self.assertEqual(data[0]['staging_total'], 0)

        self.assertEqual(data[1]['registered_total'], 2)
        self.assertEqual(data[1]['screening_total'], 2)
        self.assertEqual(data[1]['screening_pos'], 1)
        self.assertEqual(data[1]['screening_neg'], 1)
        self.assertEqual(data[1]['confirmation_total'], 1)
        self.assertEqual(data[1]['confirmation_pos'], 0)
        self.assertEqual(data[1]['confirmation_neg'], 1)
        self.assertEqual(data[1]['staging_total'], 0)

    def test_data_by_location(self):
        url = '{}?date=2016-01'.format(
            reverse('api:datasets-detail', args=['data_by_location']))
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['village'], 'Kindundu')
        self.assertEqual(response.data[0]['confirmedCases'], 1)
        self.assertEqual(
            response.data[0]['lastConfirmedCaseDate'].replace(tzinfo=None),
            datetime(2016, 1, 6, 0, 0)
        )
        self.assertEqual(response.data[1]['village'], 'Polongo')
        self.assertEqual(response.data[1]['confirmedCases'], 1)
        self.assertEqual(
            response.data[1]['lastConfirmedCaseDate'].replace(tzinfo=None),
            datetime(2016, 1, 5, 0, 0)
        )
