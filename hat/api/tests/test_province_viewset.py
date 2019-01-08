from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase


class ProvinceTests(APITestCase):
    fixtures = ['users', 'cases', 'provinces']

    def setUp(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))

    def test_list_province(self):
        url = reverse('provinces-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)

    def test_retrieve_province2(self):
        url = reverse('provinces-detail', args=[1])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'id': 1, 'name': 'Kwilu', 'old_name': 'Bandundu'})
