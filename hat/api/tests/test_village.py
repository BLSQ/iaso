from decimal import Decimal

from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase


class VillageTest(APITestCase):
    fixtures = ['locations', 'users', 'patients', 'patients', 'cases', 'provinces']
    expected_kisala = {
            "name": "Kisala",
            "province": "Kwilu",
            "former_province": "Bandundu",
            "zs": "Mosango",
            "zs_id": 11,
            "as": "Muluma",
            "as_id": 111,
            "type": "YES",
            "latitude": "-4.75555556",
            "longitude": "18.05909722",
            "gps_source": "PNLTHA-CTB",
            "population": 1004,
            "population_year": 2016,
            "population_source": None
            }

    def clean_decimal(self, data):
        return {k: str(v) if isinstance(v, Decimal) else v for k, v in data.items()}

    ###
    # General tests
    def test_list_village(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))
        url = reverse('village-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)  # All provinces
        self.assertEqual(response.data[1111]['name'], 'Kisala')
        self.assertEqual(response.data[1511]['name'], 'Bonga Village')

    def test_retrieve_village_404(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))
        url = reverse('village-detail', args=[9999999])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_village_kisala(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))
        url = reverse('village-detail', args=[1111])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.clean_decimal(response.data), self.expected_kisala)

    ###
    # Restricted users
    def test_list_village_limited(self):
        self.assertTrue(self.client.login(username='supervisor-mosango', password='supervisorsupervisor'))
        url = reverse('village-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[1111]['name'], 'Kisala')
        self.assertNotIn(1511, response.data)

    def test_retrieve_village_kisala_limited_muluma(self):
        self.assertTrue(self.client.login(username='supervisor-mosango', password='supervisorsupervisor'))
        url = reverse('village-detail', args=[1111])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.clean_decimal(response.data), self.expected_kisala)

    # Requesting YB with kisala limited user should fail
    def test_retrieve_village_yasabonga_limited_muluma(self):
        self.assertTrue(self.client.login(username='supervisor-mosango', password='supervisorsupervisor'))
        url = reverse('village-detail', args=[1511])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # AS-level
    def test_list_village_muluma_limited(self):
        self.assertTrue(self.client.login(username='supervisor-muluma', password='supervisorsupervisor'))
        url = reverse('village-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[1111]['name'], 'Kisala')
        self.assertNotIn(1511, response.data)

    def test_retrieve_village_kisala_limited_muluma(self):
        self.assertTrue(self.client.login(username='supervisor-muluma', password='supervisorsupervisor'))
        url = reverse('village-detail', args=[1111])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'id': 1111, 'name': 'Kisala', 'ZS_id': 1})

    # Requesting YB with muluma limited user should fail
    def test_retrieve_village_kisala_limited_muluma(self):
        self.assertTrue(self.client.login(username='supervisor-muluma', password='supervisorsupervisor'))
        url = reverse('village-detail', args=[1511])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Province level
    def test_list_prov_kwilu_limited(self):
        self.assertTrue(self.client.login(username='supervisor-kwilu', password='supervisorsupervisor'))
        url = reverse('village-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)  # 4 AS in Kwilu
        self.assertEqual(response.data[1111]['name'], 'Kisala')
        self.assertNotIn(2111, response.data)

    def test_retrieve_prov_kwilu_limited_muluma(self):
        self.assertTrue(self.client.login(username='supervisor-kwilu', password='supervisorsupervisor'))
        url = reverse('village-detail', args=[1111])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.clean_decimal(response.data), self.expected_kisala)

    # Requesting YB with Kisala limited user should fail
    def test_retrieve_prov_kwilu_limited_boko(self):
        self.assertTrue(self.client.login(username='supervisor-kwilu', password='supervisorsupervisor'))
        url = reverse('village-detail', args=[2111])  # Boko in Kwango, should not be visible
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
