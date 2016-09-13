from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class CasesTests(APITestCase):
    fixtures = ['api_cases.json']

    def test_list_cases(self):
        url = reverse('api:cases-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 5)
        self.assertEqual(response.data['results'][0]['document_id'], '1')

    def test_retrieve_case(self):
        url = reverse('api:cases-detail', args=['1'])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['document_id'], '1')
