from iaso.test import APITestCase


class StorageAPITestCase(APITestCase):
    def test_post_log_needs_authentication(self):
        """POST /api/mobile/storage/log/ is rejected if user is not authenticated."""
        response = self.client.post("/api/mobile/storage/logs/")
        self.assertEqual(response.status_code, 403)  # TODO: Would be better to return 401?
