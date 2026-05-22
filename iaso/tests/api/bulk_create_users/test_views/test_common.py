from rest_framework import status

from iaso.test import APITestCase

from .common import BASE_URL, BulkCreateBaseAPITestCaseMixin


class BulkCreateUsersAPITestCase(BulkCreateBaseAPITestCaseMixin, APITestCase):
    def test_user_cant_access_without_permission(self):
        self.client.force_authenticate(self.obi)
        self.source.projects.set([self.project])

        response = self.client.get(f"{BASE_URL}")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_can_access_with_managed_geo_limit_permission(self):
        self.client.force_authenticate(self.user_managed_geo_limit)
        self.source.projects.set([self.project])

        response = self.client.post(f"{BASE_URL}")

        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
