from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework import status

from iaso import models as m
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class FormsDropdownAPITestCase(SwaggerTestCaseMixin, APITestCase):
    """Tests for the lightweight GET /api/forms/dropdown/ endpoint ({value, label})."""

    @classmethod
    def setUpTestData(cls):
        cls.account1 = m.Account.objects.create(name="Star Wars")
        cls.account2 = m.Account.objects.create(name="Marvel")

        cls.user1 = cls.create_user_with_profile(
            username="user1", account=cls.account1, permissions=[CORE_FORMS_PERMISSION]
        )
        # Authenticated but without the forms permission, and in another account.
        cls.user2 = cls.create_user_with_profile(username="user2", account=cls.account2)

        cls.orgType1 = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")

        cls.project = m.Project.objects.create(name="Hydroponics", app_id="sw.hydroponics", account=cls.account1)
        cls.account2_project = m.Project.objects.create(
            name="Avengers", app_id="account2.avengers", account=cls.account2
        )

        # Two forms in the user's account, created out of order to check ordering by name.
        cls.form_beta = m.Form.objects.create(name="Beta form", form_id="beta")
        cls.form_alpha = m.Form.objects.create(name="Alpha form", form_id="alpha")
        cls.form_alpha.org_unit_types.add(cls.orgType1)
        cls.project.forms.add(cls.form_alpha, cls.form_beta)

        # A form in another account: it must never be exposed to user1.
        cls.account2_form = m.Form.objects.create(name="Marvel form", form_id="account2")
        cls.account2_project.forms.add(cls.account2_form)

    @property
    def url(self):
        return reverse("forms-dropdown")

    def assertValidData(self, data, expected_length):
        self.assertEqual(len(data), expected_length)
        self.assertResponseCompliantToSwagger(data, "FormDropdown", as_array=True)

    def test_permissions(self):
        res = self.client.get(self.url)
        data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(data, 0)

        self.client.force_authenticate(self.user2)
        res = self.client.get(self.url)
        data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(data, 1)
        self.assertEqual(data[0]["value"], self.account2_form.id)

        self.client.force_authenticate(self.user1)
        res = self.client.get(self.url)
        data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(data, 2)

    def test_dropdown(self):
        self.client.force_authenticate(self.user1)
        res = self.client.get(self.url)
        data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidData(data, 2)
        self.assertEqual(
            data,
            [
                {"value": self.form_alpha.id, "label": "Alpha form"},
                {"value": self.form_beta.id, "label": "Beta form"},
            ],
        )
        self.assertNotIn(self.account2_form.id, [form["value"] for form in data])

    def test_filters(self):
        self.client.force_authenticate(self.user1)

        # Case-insensitive search by name.
        res = self.client.get(self.url, data={"search": "alpha"})
        data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(data, 1)
        self.assertEqual(data[0]["label"], "Alpha form")

        # Filter by org unit type.
        res = self.client.get(self.url, data={"orgUnitTypeId": self.orgType1.id})
        data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(data, 1)
        self.assertEqual(data[0]["value"], self.form_alpha.id)

        # Filter by project.
        res = self.client.get(self.url, data={"projectsIds": str(self.project.id)})
        data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(data, 2)

        # No match.
        res = self.client.get(self.url, data={"search": "no-such-form"})
        data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(data, 0)

    def test_num_queries(self):
        """No N+1: the query count must not grow proportionally to the number of forms.

        The count is not perfectly constant (prefetch issues a few data-dependent
        queries), so we assert the delta stays well below the number of forms added
        rather than an exact figure.
        """
        self.client.force_authenticate(self.user1)

        with CaptureQueriesContext(connection) as before:
            self.assertJSONResponse(self.client.get(self.url), status.HTTP_200_OK)

        extra_forms = 10
        for i in range(extra_forms):
            self.project.forms.add(m.Form.objects.create(name=f"Extra {i}", form_id=f"extra-{i}"))

        with CaptureQueriesContext(connection) as after:
            data = self.assertJSONResponse(self.client.get(self.url), status.HTTP_200_OK)

        self.assertValidData(data, 2 + extra_forms)
        self.assertLess(
            len(after.captured_queries) - len(before.captured_queries),
            extra_forms,
        )
