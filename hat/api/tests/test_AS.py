from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase


class ASTest(APITestCase):
    fixtures = ['locations', 'users', 'cases', 'provinces']
    expected_as = {
            'id': 111,
            'name': 'Muluma',
            'zs_id': 11,
            'zs_name': 'Mosango',
            'province_id': 1,
            'province_name': 'Kwilu',
        }

    ###
    # General tests
    def test_list_as(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))
        url = reverse('as-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.count(), 5)  # All provinces
        self.assertEqual(response.data.get(id=111)['name'], 'Muluma')
        self.assertEqual(response.data.get(id=151)['name'], 'Yasa')

    def test_retrieve_as_404(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))
        url = reverse('as-detail', args=[9999999])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_as_muluma(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))
        url = reverse('as-detail', args=[111])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, self.expected_as)

    ###
    # Restricted users
    def test_list_as_limited(self):
        self.assertTrue(self.client.login(username='supervisor-mosango', password='supervisorsupervisor'))
        url = reverse('as-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.count(), 2)
        self.assertEqual(response.data.get(id=111)['name'], 'Muluma')
        self.assertEqual(response.data.filter(id=151).count(), 0)

    def test_retrieve_as_muluma_limited_muluma(self):
        self.assertTrue(self.client.login(username='supervisor-mosango', password='supervisorsupervisor'))
        url = reverse('as-detail', args=[111])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, self.expected_as)

    # Requesting YB with muluma limited user should fail
    def test_retrieve_as_yasabonga_limited_muluma(self):
        self.assertTrue(self.client.login(username='supervisor-mosango', password='supervisorsupervisor'))
        url = reverse('as-detail', args=[151])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # AS-level
    def test_list_as_muluma_limited(self):
        self.assertTrue(self.client.login(username='supervisor-muluma', password='supervisorsupervisor'))
        url = reverse('as-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.count(), 1)
        self.assertEqual(response.data.get(id=111)['name'], 'Muluma')
        self.assertEqual(response.data.filter(id=151).count(), 0)

    def test_retrieve_as_muluma_limited_muluma(self):
        self.assertTrue(self.client.login(username='supervisor-muluma', password='supervisorsupervisor'))
        url = reverse('as-detail', args=[111])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, self.expected_as)

    # Requesting YB with muluma limited user should fail
    def test_retrieve_as_yasa_limited_muluma(self):
        self.assertTrue(self.client.login(username='supervisor-muluma', password='supervisorsupervisor'))
        url = reverse('as-detail', args=[151])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Province level
    def test_list_prov_kwilu_limited(self):
        self.assertTrue(self.client.login(username='supervisor-kwilu', password='supervisorsupervisor'))
        url = reverse('as-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.count(), 4)  # 4 AS in Kwilu
        self.assertEqual(response.data.get(id=111)['name'], 'Muluma')
        self.assertEqual(response.data.filter(id=211).count(), 0)

    def test_retrieve_prov_kwilu_limited_muluma(self):
        self.assertTrue(self.client.login(username='supervisor-kwilu', password='supervisorsupervisor'))
        url = reverse('as-detail', args=[111])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, self.expected_as)

    # Requesting YB with muluma limited user should fail
    def test_retrieve_prov_kwilu_limited_boko(self):
        self.assertTrue(self.client.login(username='supervisor-kwilu', password='supervisorsupervisor'))
        url = reverse('as-detail', args=[211])  # Boko in Kwango, should not be visible
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
