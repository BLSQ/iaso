from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase


class ZSTest(APITestCase):
    fixtures = ['locations', 'users', 'cases', 'provinces']
    expected_zs = {'id': 11, 'name': 'Mosango', 'province_id': 1}

    ###
    # General tests
    def test_list_zs(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))
        url = reverse('zs-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.count(), 3)  # All provinces
        self.assertEqual(response.data.get(id=11)['name'], 'Mosango')
        self.assertEqual(response.data.get(id=15)['name'], 'Yasa Bonga')

    def test_retrieve_zs_404(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))
        url = reverse('zs-detail', args=[9999999])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_zs_mosango(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))
        url = reverse('zs-detail', args=[11])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, self.expected_zs)

    ###
    # Restricted users
    def test_list_zs_limited(self):
        self.assertTrue(self.client.login(username='supervisor-mosango', password='supervisorsupervisor'))
        url = reverse('zs-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.count(), 1)
        self.assertEqual(response.data.get(id=11)['name'], 'Mosango')
        self.assertEqual(response.data.filter(id=15).count(), 0)

    def test_retrieve_zs_mosango_limited_mosango(self):
        self.assertTrue(self.client.login(username='supervisor-mosango', password='supervisorsupervisor'))
        url = reverse('zs-detail', args=[11])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, self.expected_zs)

    # Requesting YB with Mosango limited user should fail
    def test_retrieve_zs_yasabonga_limited_mosango(self):
        self.assertTrue(self.client.login(username='supervisor-mosango', password='supervisorsupervisor'))
        url = reverse('zs-detail', args=[15])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # AS-level
    def test_list_as_muluma_limited(self):
        self.assertTrue(self.client.login(username='supervisor-muluma', password='supervisorsupervisor'))
        url = reverse('zs-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.count(), 1)
        self.assertEqual(response.data.get(id=11)['name'], 'Mosango')
        self.assertEqual(response.data.filter(id=15).count(), 0)

    def test_retrieve_as_muluma_limited_mosango(self):
        self.assertTrue(self.client.login(username='supervisor-muluma', password='supervisorsupervisor'))
        url = reverse('zs-detail', args=[11])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, self.expected_zs)

    # Requesting YB with Mosango limited user should fail
    def test_retrieve_as_YB_limited_mosango(self):
        self.assertTrue(self.client.login(username='supervisor-muluma', password='supervisorsupervisor'))
        url = reverse('zs-detail', args=[15])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Province level
    def test_list_prov_kwilu_limited(self):
        self.assertTrue(self.client.login(username='supervisor-kwilu', password='supervisorsupervisor'))
        url = reverse('zs-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.count(), 2)  # 2 ZS in Kwilu
        self.assertEqual(response.data.get(id=11)['name'], 'Mosango')
        self.assertEqual(response.data.filter(id=21).count(), 0)

    def test_retrieve_prov_kwilu_limited_mosango(self):
        self.assertTrue(self.client.login(username='supervisor-kwilu', password='supervisorsupervisor'))
        url = reverse('zs-detail', args=[11])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, self.expected_zs)

    # Requesting YB with Mosango limited user should fail
    def test_retrieve_prov_kwilu_limited_boko(self):
        self.assertTrue(self.client.login(username='supervisor-kwilu', password='supervisorsupervisor'))
        url = reverse('zs-detail', args=[21])  # Boko in Kwango, should not be visible
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
