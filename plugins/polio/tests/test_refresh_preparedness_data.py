from iaso import models as m
from iaso.test import APITestCase
from plugins.polio.models import Campaign


class RefreshPreparednessTestCase(APITestCase):
    @classmethod
    def setUp(cls):
        cls.url = "/api/tasks/create/refreshpreparedness/"
        cls.account = account = m.Account.objects.create(name="test account")
        cls.other_account = m.Account.objects.create(name="other account")
        cls.user = cls.create_user_with_profile(username="test user", account=account, permissions=["iaso_polio"])
        cls.campaign = Campaign.objects.create(obr_name="right_campaign", account=account)
        cls.wrong_campaign = Campaign.objects.create(obr_name="wrong_campaign", account=cls.other_account)

    def test_no_perm(self):
        user_no_perm = self.create_user_with_profile(username="test user2", account=self.account, permissions=[])
        self.client.force_authenticate(user_no_perm)
        response = self.client.post(
            self.url,
            format="json",
            data={"obr_name": self.campaign.obr_name},
        )
        jr = self.assertJSONResponse(response, 403)
        self.assertEqual({"detail": "You do not have permission to perform this action."}, jr)

    def test_wrong_obr_name(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            format="json",
            data={"obr_name": "Bleh"},
        )
        jr = self.assertJSONResponse(response, 400)
        self.assertEqual({"non_field_errors": ["Invalid campaign name"]}, jr)

    def test_wrong_account(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            format="json",
            data={"obr_name": self.wrong_campaign.obr_name},
        )
        jr = self.assertJSONResponse(response, 400)
        self.assertEqual({"non_field_errors": ["Invalid campaign name"]}, jr)

    def test_ok(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            format="json",
            data={"obr_name": self.campaign.obr_name},
        )
        jr = self.assertJSONResponse(response, 200)
        task = self.assertValidTaskAndInDB(jr)
        self.assertEqual(task.launcher, self.user)
        self.assertEqual(task.params["kwargs"]["obr_name"], self.campaign.obr_name)
