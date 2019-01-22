from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
import json


class CasesTest(APITestCase):
    fixtures = ['locations', 'users', 'patients', 'cases', 'provinces']

    ###
    # General tests
    def test_list_cases(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))
        url = reverse('cases-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 6)  # All provinces
        cases = {x['id']: x for x in response.data['cases']}
        self.assertEqual(cases[1]['patient']['year_of_birth'], 1921)
        self.assertEqual(cases[2]['patient']['id'], 102)
        self.assertEqual(cases[3]['normalized_village_name'], 'Kisala')
        self.assertEqual(cases[4]['source'], 'mobile_backup')
        self.assertEqual(cases[4]['normalized_as_name'], 'Muwanda-koso')
        c6_norm = cases[6]['location']['normalized']
        self.assertFalse(c6_norm['normalized_village_not_found'])
        self.assertEquals(c6_norm['village']['population'], 1004)

    def test_list_cases_filter_village_id(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))
        url = reverse('cases-list') + "?village_id=2111,1511"
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    ###
    # Limited users
    def test_list_cases_zs_mosango(self):
        self.assertTrue(self.client.login(username='supervisor-mosango', password='supervisorsupervisor'))
        url = reverse('cases-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 4)
        cases_in_mosango = [x for x in response.data['cases'] if x['normalized_zs_name'] == 'Mosango']
        self.assertEqual(len(cases_in_mosango), 4)

    def test_list_cases_as_muluma(self):
        self.assertTrue(self.client.login(username='supervisor-muluma', password='supervisorsupervisor'))
        url = reverse('cases-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)
        cases_in_muluma = [x for x in response.data['cases'] if x['normalized_as_name'] == 'Muluma']
        self.assertEqual(len(cases_in_muluma), 3)

    def test_list_cases_prov_kwilu(self):
        self.assertTrue(self.client.login(username='supervisor-kwilu', password='supervisorsupervisor'))
        url = reverse('cases-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 5)
        cases_in_kwilu = [x for x in response.data['cases'] if x['normalized_province_name'] == 'Kwilu']
        self.assertEqual(len(cases_in_kwilu), 5)
