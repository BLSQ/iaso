from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class VisualizationsTests(APITestCase):
    fixtures = ['users']

    def setUp(self):
        self.assertTrue(self.client.login(username='admin', password='adminadmin'))

    def test_list_visualizations(self):
        url = reverse('api:visualizations-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_retrieve_visualization(self):
        url = reverse('api:visualizations-detail', args=['count_by_date'])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['type'], 'vega-lite')
