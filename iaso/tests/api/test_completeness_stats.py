from unittest import mock

from iaso.models import Account, Form, Project, OrgUnitType, OrgUnit
from iaso.test import APITestCase
from django.contrib.auth.models import User, Permission


class CompletenessStatsAPITestCase(APITestCase):
    fixtures = ["user.yaml", "orgunit.yaml"]
    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.get(username="test")
        cls.account = Account.objects.get(name="test")
        # cls.star_wars = Account.objects.create(name="Star Wars")
        # cls.yoda = cls.create_user_with_profile(
        #     username="yoda", account=cls.star_wars, permissions=["iaso_completeness_stats"]
        # )

        # Another user that doesn't have the permission for this feature
        cls.another_user = cls.create_user_with_profile(username="yoda2", account=cls.account)

        # We create two forms for the user (we also need a project to create the asssociation)
        cls.form_1 = Form.objects.create(name="Hydroponics study")
        cls.form_2 = Form.objects.create(name="Hydroponics study 2")
        cls.form_3 = Form.objects.create(name="Hydroponics study 3")
        cls.project_1 = cls.account.project_set.first()
        cls.project_1.forms.add(cls.form_1)
        cls.project_1.forms.add(cls.form_2)
        cls.project_1.save()
        cls.org_unit_type_1 = OrgUnitType.objects.get(pk=5)  # alternate pk: 4
        cls.org_unit_type_2 = OrgUnitType.objects.get(pk=4)  # alternate pk: 4
        cls.form_1.org_unit_types.add(cls.org_unit_type_1)
        cls.form_2.org_unit_types.add(cls.org_unit_type_1)
        cls.form_3.org_unit_types.add(cls.org_unit_type_2)
        cls.org_unit = OrgUnit.objects.filter(org_unit_type=cls.org_unit_type_1).first()
        cls.create_form_instance(form=cls.form_1, org_unit=cls.org_unit)

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
        self.user.user_permissions.add(Permission.objects.get(codename="iaso_completeness_stats"))
        self.client.force_authenticate(self.user)
        # TODO: Test the basics of row listing (status code, data line in simple cases, ...)

        response = self.client.get("/api/completeness_stats/")
        j = self.assertJSONResponse(response, 200)
        self.assertDictEqual(
            j,
            {
                "count": 2,
                "results": [
                    {
                        "parent_org_unit": None,
                        "org_unit_type": {"name": "Country", "id": mock.ANY},
                        "org_unit": {"name": "LaLaland", "id": mock.ANY},
                        "form": {"name": "Hydroponics study", "id": mock.ANY},
                        "forms_filled": 1,
                        "forms_to_fill": 1,
                        "completeness_ratio": 100.0,
                    },
                    {
                        "parent_org_unit": None,
                        "org_unit_type": {"name": "Country", "id": mock.ANY},
                        "org_unit": {"name": "LaLaland", "id": mock.ANY},
                        "form": {"name": "Hydroponics study 2", "id": mock.ANY},
                        "forms_filled": 0,
                        "forms_to_fill": 1,
                        "completeness_ratio": 0,
                    },
                ],
                "has_next": False,
                "has_previous": False,
                "page": 1,
                "pages": 1,
                "limit": 50,
            },
        )

    # TODO: Test the data is filtered by account
    # TODO: Test that data can be filtered by OU type
    # TODO: Test that data can be filtered by parent OU
    # TODO: Test that data can be filtered by form_ids
