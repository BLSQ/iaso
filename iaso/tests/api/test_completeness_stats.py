from iaso.models import Account, Form, Project
from iaso.test import APITestCase


class CompletenessStatsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.star_wars = Account.objects.create(name="Star Wars")
        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=cls.star_wars, permissions=["iaso_completeness_stats"]
        )

        # Another user that doesn't have the permission for this feature
        cls.another_user = cls.create_user_with_profile(username="yoda2", account=cls.star_wars)

        # We create two forms for the user (we also need a project to create the asssociation)
        cls.form_1 = Form.objects.create(name="Hydroponics study")
        cls.form_2 = Form.objects.create(name="Hydroponics study 2")
        cls.project_1 = Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=cls.star_wars
        )
        cls.project_1.forms.add(cls.form_1)
        cls.project_1.forms.add(cls.form_2)
        cls.project_1.save()

        # Some OrgUnits

    def test_row_listing_anonymous(self):
        """An anonymous user should not be able to access the API"""
        response = self.client.get("/api/completeness_stats/")
        self.assertEqual(response.status_code, 403)

    def test_row_listing_insufficient_permissions(self):
        """A user without the permission should not be able to access the API"""
        self.client.force_authenticate(self.another_user)

        response = self.client.get("/api/completeness_stats/")
        self.assertEqual(response.status_code, 403)

    def test_base_row_listing(self):
        self.client.force_authenticate(self.yoda)
        # TODO: Test the basics of row listing (status code, data line in simple cases, ...)

        response = self.client.get("/api/completeness_stats/")
        self.assertEqual(response.status_code, 200)

    # TODO: Test the data is filtered by account
    # TODO: Test that data can be filtered by OU type
    # TODO: Test that data can be filtered by parent OU
    # TODO: Test that data can be filtered by form_ids
