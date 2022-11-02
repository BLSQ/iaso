from iaso.models import Account
from iaso.test import APITestCase


class CompletenessStatsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.star_wars = Account.objects.create(name="Star Wars")
        cls.yoda = cls.create_user_with_profile(username="yoda", account=cls.star_wars, permissions=["iaso_storages"])

    def test_base_row_listing(self):
        self.client.force_authenticate(self.yoda)
        # TODO: Test the basics of row listing (status code, data line in simple cases, ...)

        response = self.client.get("/api/completeness_stats/")
        self.assertEqual(response.status_code, 200)

    # TODO: test access denied for unauthenticated + users without the specific permission
    # TODO: Test the data is filtered by account
    # TODO: Test that data can be filtered by OU type
    # TODO: Test that data can be filtered by parent OU
    # TODO: Test that data can be filtered by form_ids
