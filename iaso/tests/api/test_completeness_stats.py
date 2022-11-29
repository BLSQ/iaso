from unittest import mock

from iaso.models import Account, Form, OrgUnitType, OrgUnit
from iaso.test import APITestCase
from django.contrib.auth.models import User, Permission


class CompletenessStatsAPITestCase(APITestCase):
    fixtures = ["user.yaml", "orgunit.yaml"]
    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.get(username="test")
        cls.user.user_permissions.add(Permission.objects.get(codename="iaso_completeness_stats"))
        cls.account = Account.objects.get(name="test")

        # Another user that doesn't have the permission for this feature
        cls.user_without_permission = cls.create_user_with_profile(username="yoda2", account=cls.account)

        # We create two forms for the user (we also need a project to create the association)
        cls.form_hs_1 = Form.objects.create(name="Hydroponics study 1")
        cls.form_hs_2 = Form.objects.create(name="Hydroponics study 2")

        # This one won't appear because we don't associate it to the user (via project)
        cls.form_hs_3 = Form.objects.create(name="Hydroponics study 3")
        cls.form_hs_4 = Form.objects.create(name="Hydroponics study 4")

        cls.project_1 = cls.account.project_set.first()
        cls.project_1.forms.add(cls.form_hs_1)
        cls.project_1.forms.add(cls.form_hs_2)
        cls.project_1.forms.add(cls.form_hs_4)
        cls.project_1.save()
        cls.org_unit_type_1 = OrgUnitType.objects.get(pk=5)  # alternate pk: 4
        cls.org_unit_type_2 = OrgUnitType.objects.get(pk=4)  # alternate pk: 4
        cls.form_hs_1.org_unit_types.add(cls.org_unit_type_1)
        cls.form_hs_2.org_unit_types.add(cls.org_unit_type_1)
        cls.form_hs_3.org_unit_types.add(cls.org_unit_type_2)
        cls.form_hs_4.org_unit_types.add(cls.org_unit_type_2)
        cls.org_unit = OrgUnit.objects.filter(org_unit_type=cls.org_unit_type_1).first()
        cls.create_form_instance(form=cls.form_hs_1, org_unit=cls.org_unit)

    def test_row_listing_anonymous(self):
        """An anonymous user should not be able to access the API"""
        response = self.client.get("/api/completeness_stats/")
        self.assertEqual(response.status_code, 403)

    def test_row_listing_insufficient_permissions(self):
        """A user without the permission should not be able to access the API"""
        self.client.force_authenticate(self.user_without_permission)

        response = self.client.get("/api/completeness_stats/")
        self.assertEqual(response.status_code, 403)

    def test_base_row_listing(self):
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/completeness_stats/")
        j = self.assertJSONResponse(response, 200)
        self.assertDictEqual(
            {
                "count": 3,
                "results": [
                    {
                        "parent_org_unit": None,
                        "org_unit_type": {"name": "Country", "id": 1},
                        "org_unit": {"name": "LaLaland", "id": 1},
                        "form": {"name": "Hydroponics study 1", "id": self.form_hs_1.id},
                        "forms_filled": 1,
                        "forms_to_fill": 1,
                        "completeness_ratio": "100.0%",
                    },
                    {
                        "parent_org_unit": None,
                        "org_unit_type": {"name": "Country", "id": 1},
                        "org_unit": {"name": "LaLaland", "id": 1},
                        "form": {"name": "Hydroponics study 2", "id": self.form_hs_2.id},
                        "forms_filled": 0,
                        "forms_to_fill": 1,
                        "completeness_ratio": "0.0%",
                    },
                    {
                        "parent_org_unit": None,
                        "org_unit_type": {"name": "Country", "id": 1},
                        "org_unit": {"name": "LaLaland", "id": 1},
                        "form": {"name": "Hydroponics study 4", "id": self.form_hs_4.id},
                        "forms_filled": 0,
                        "forms_to_fill": 1,
                        "completeness_ratio": "0.0%",
                    },
                ],
                "has_next": False,
                "has_previous": False,
                "page": 1,
                "pages": 1,
                "limit": 50,
            },
            j,
        )

    def test_no_filters_only_heads(self):
        """No filters are used: only the heads OU (countries) are returned"""
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/completeness_stats/")
        json = response.json()
        for result in json["results"]:
            # There are lower-levels OUs in fixtures, but they shouldn't appear here
            self.assertIsNone(result["parent_org_unit"])

    def test_filter_by_form_type(self):
        """Filtering by form type"""
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/completeness_stats/?form_id={self.form_hs_1.id}")
        json = response.json()
        # Without filtering, we would also have results for form_hs_2 and form_hs_4 just like in test_base_row_listing()
        for result in json["results"]:
            self.assertEqual(result["form"]["id"], self.form_hs_1.id)

    def test_filter_by_multiple_form_types(self):
        """Filtering by multiple form types"""
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/completeness_stats/?form_id={self.form_hs_1.id}, {self.form_hs_4.id}")
        json = response.json()
        # Without filtering, we would also have results for form_hs_2 just like in test_base_row_listing()
        for result in json["results"]:
            form_id_result = result["form"]["id"]
            self.assertIn(form_id_result, [self.form_hs_1.id, self.form_hs_4.id])

    def test_only_forms_from_account(self):
        """Only forms from the account are returned"""
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/completeness_stats/?form_id={self.form_hs_3.id}")
        json = response.json()
        # No results because the form is not in the user's account
        self.assertEqual(json["count"], 0)

    def test_only_valid_ou_returned(self):
        """OUs with a non-valid status are excluded from the API"""

    def test_filter_by_org_unit_type(self):
        pass

    def test_filter_by_multiple_org_unit_types(self):
        pass

    def test_filter_by_parent_org_unit(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/completeness_stats/?parent_id=1")
        json = response.json()
        # TODO: implement once the correct behaviour is clarified

    def test_combined_filters(self):
        pass

    # TODO: test that we can get N/A instead of divide by 0
    # TODO: Test the data is filtered by account
    # TODO: Test that data can be filtered by OU type
    # TODO: Test that data can be filtered by parent OU
    # TODO: Test that data can be filtered by form_ids
