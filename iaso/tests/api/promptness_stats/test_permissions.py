from rest_framework import status

from iaso.tests.api.promptness_stats.common import PromptnessStatsTestCase


class PromptnessStatsPermissionsTestCase(PromptnessStatsTestCase):
    URLS = [PromptnessStatsTestCase.URL, PromptnessStatsTestCase.EXPORT_CSV_URL]

    def test_anonymous_user(self):
        for url in self.URLS:
            with self.subTest(url=url):
                response = self.client.get(url, self.get_serializer_params())
                self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_without_permission(self):
        self.client.force_authenticate(self.user_no_perm)
        for url in self.URLS:
            with self.subTest(url=url):
                response = self.client.get(url, self.get_serializer_params())
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_users_with_permission(self):
        for user in [self.user, self.user_registry_read, self.user_registry_write]:
            self.client.force_authenticate(user)
            for url in self.URLS:
                with self.subTest(user=user.username, url=url):
                    response = self.client.get(url, self.get_serializer_params())
                    self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_write_methods_not_allowed(self):
        self.client.force_authenticate(self.user)
        for url in self.URLS:
            for method in ["post", "put", "patch", "delete"]:
                with self.subTest(url=url, method=method):
                    response = getattr(self.client, method)(url, self.get_serializer_params(), format="json")
                    self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_detail_route_does_not_exist(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{self.URL}{self.ethiopia.id}/", self.get_serializer_params())
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
