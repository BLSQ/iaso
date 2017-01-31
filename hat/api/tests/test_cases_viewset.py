from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from hat.cases.models import CaseView


class CasesTests(APITestCase):
    fixtures = ['users', 'cases']

    def setUp(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))

    def test_list_cases(self):
        url = reverse('api:cases-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], CaseView.objects.all().count())
        case = response.data['results'][0]
        # Newest document should come first
        self.assertEqual(case['document_id'], '6')
        # Documents should have the CaseView test fields
        self.assertIn('screening_result', case)
        self.assertIn('confirmation_result', case)
        self.assertIn('stage_result', case)
        # Check the reponse has our custom pagination keys
        self.assertIn('limit', response.data)
        self.assertIn('offset', response.data)

    def test_retrieve_case(self):
        url = reverse('api:cases-detail', args=['1'])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['document_id'], '1')
