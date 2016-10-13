from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import datetime


class DatasetTests(APITestCase):
    fixtures = ['users', 'api_cases.json']

    def setUp(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))

    def test_list_datasets(self):
        url = reverse('api:datasets-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 6)

    def test_total_count(self):
        url = reverse('api:datasets-detail', args=['count_total'])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'female': 3, 'male': 2, 'registered': 6, 'tested': 5})

    def test_screened_count(self):
        url = reverse('api:datasets-detail', args=['count_screened'])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {'negative': 1, 'positive': 2, 'total': 3, 'missing_confirmation': 1})

    def test_confirmed_count(self):
        url = reverse('api:datasets-detail', args=['count_confirmed'])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'negative': 1, 'positive': 2, 'total': 3})

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
