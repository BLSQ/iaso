from iaso import models as m
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase


class FeatureFlagAPITestCases(APITestCase):
    @classmethod
    def setUpTestData(cls):
        wha = m.Account.objects.create(name="Worldwide Health Aid")
        cls.john = cls.create_user_with_profile(username="johndoe", account=wha, permissions=[CORE_FORMS_PERMISSION])
        m.FeatureFlag.objects.create(code="first_test", name="first", order=1, category="DCO")
        m.FeatureFlag.objects.create(code="second_test", name="second", order=6, category="DCO")
        m.FeatureFlag.objects.create(code="third_test", name="third", order=3, category="REO")
        m.FeatureFlag.objects.create(code="fourth_test", name="fourth", order=4, category="REO")
        m.FeatureFlag.objects.create(code="fifth_test", name="fifth", order=5, category="DCO")

    def test_feature_flag_order(self):
        """GET /featureflags/ should result ordered feature flag per category then order"""
        self.client.force_authenticate(self.john)

        response = self.client.get("/api/featureflags/")
        self.assertJSONResponse(response, 200)
        response_data = response.json()
        response_feature_flags = response_data["featureflags"]
        feature_flags = [ff for ff in response_feature_flags if ff["code"].endswith("_test")]
        self.assertEqual(feature_flags[0]["code"], "first_test")
        self.assertEqual(feature_flags[1]["code"], "fifth_test")
        self.assertEqual(feature_flags[2]["code"], "second_test")
        self.assertEqual(feature_flags[3]["code"], "third_test")
        self.assertEqual(feature_flags[4]["code"], "fourth_test")
