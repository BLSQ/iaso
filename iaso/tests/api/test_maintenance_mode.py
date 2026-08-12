from rest_framework import status

from iaso.test import APITestCase


class MaintenanceModeTestCase(APITestCase):
    def test_maintenance_mode(self):
        """Test that /login/ and /api/ are not accessible in maintenance mode"""
        urlconfs = ["hat.urls", "iaso.urls"]
        with self.settings(MAINTENANCE_MODE=True):
            self.reload_urls(urlconfs)
            response = self.client.get("/login/")
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
            response = self.client.get("/_health/")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            response = self.client.get("/api/")
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.reload_urls(urlconfs)

    def test_homepage_accessible(self):
        """Test that /login/, /api/ and /_health/ are accessible outside of maintenance mode"""
        urlconfs = ["hat.urls", "iaso.urls"]
        with self.settings(MAINTENANCE_MODE=False):
            self.reload_urls(urlconfs)
            response = self.client.get("/login/")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            response = self.client.get("/_health/")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            response = self.client.get("/api/")
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.reload_urls(urlconfs)
