from iaso import models as m
from iaso.test import APITestCase


class CustomTranslationsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.ghi = m.Account.objects.create(
            name="Global Health Initiative",
            custom_translations={"en": {"custom.key": "Custom value"}},
        )
        cls.wha = m.Account.objects.create(name="Worldwide Health Aid")

        cls.jane = cls.create_user_with_profile(username="janedoe", account=cls.ghi)
        cls.john = cls.create_user_with_profile(username="johndoe", account=cls.wha)

    def test_custom_translations_requires_authentication(self):
        response = self.client.get(f"/api/custom_translations/?account_id={self.ghi.pk}")
        self.assertJSONResponse(response, 401)

    def test_custom_translations_requires_account_id(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get("/api/custom_translations/")
        data = self.assertJSONResponse(response, 400)
        self.assertEqual(data, {"account_id": ["Account id is required."]})

    def test_custom_translations_forbidden_for_other_account(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(f"/api/custom_translations/?account_id={self.wha.pk}")
        data = self.assertJSONResponse(response, 403)
        self.assertEqual(data, {"detail": "You do not have permission to perform this action."})

    def test_custom_translations_success(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(f"/api/custom_translations/?account_id={self.ghi.pk}")
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(data, {"custom_translations": {"en": {"custom.key": "Custom value"}}})
