from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class DatasetTests(APITestCase):
    fixtures = ['users', 'api_cases.json']

    def setUp(self):
        self.assertTrue(self.client.login(username='admin', password='adminadmin'))

    def test_list_datasets(self):
        url = reverse('api:datasets-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)

    def test_total_count(self):
        url = reverse('api:datasets-detail', args=['count_total'])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'value': 6})

    def test_screened_count(self):
        url = reverse('api:datasets-detail', args=['count_screened'])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'value': 3})

    def test_confirmed_count(self):
        url = reverse('api:datasets-detail', args=['count_confirmed'])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'value': 2})

    def test_tested_count(self):
        url = reverse('api:datasets-detail', args=['count_tested'])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'value': 5})

    def test_screened_per_date_day(self):
        url = '{}?date_trunc=day'.format(
            reverse('api:datasets-detail', args=['list_screened']))
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_screened_per_date_month(self):
        url = '{}?date_trunc=month'.format(
            reverse('api:datasets-detail', args=['list_screened']))
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['count'], 3)
