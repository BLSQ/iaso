from iaso.api.query_params import APP_ID
from iaso.models import Account, StoragePassword, Project
from iaso.test import APITestCase


class StorageAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.star_wars = Account.objects.create(name="Star Wars")
        cls.rebels = Project.objects.create(name="Rebels", app_id="in.a.galaxy.far.away", account=cls.star_wars)
        cls.empire = Project.objects.create(name="Empire", app_id="death.star", account=cls.star_wars)
        cls.yoda = cls.create_user_with_profile(username="Yoda", account=cls.star_wars)

        cls.rebels_password1 = StoragePassword.objects.create(
            password="Fear is the path to the dark side.", project=cls.rebels
        )
        cls.rebels_password2 = StoragePassword.objects.create(
            password="Try not. Do. Or do not. There is no try.", is_compromised=True, project=cls.rebels
        )
        cls.rebels_password3 = StoragePassword.objects.create(
            password="Truly wonderful, the mind of a child is.", project=cls.rebels
        )

        cls.empire_password1 = StoragePassword.objects.create(
            password="You don’t know the power of the dark side!", project=cls.empire
        )
        cls.empire_password2 = StoragePassword.objects.create(
            password="I am altering the deal. Pray I don’t alter it any further.",
            is_compromised=True,
            project=cls.empire,
        )
        cls.empire_password3 = StoragePassword.objects.create(
            password="I find your lack of faith disturbing.", project=cls.empire
        )

    def test_retrieve_passwords_without_authentication(self):
        response = self.client.get("/api/mobile/storage/passwords/", data={APP_ID: self.rebels.app_id})
        self.assertEqual(response.status_code, 403)

    def test_post_passwords_without_authentication(self):
        response = self.client.post(
            "/api/mobile/storage/passwords/",
            data={
                "password": "test",
                "is_compromised": True,
                "project": self.rebels.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_post_passwords_with_authentication(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            "/api/mobile/storage/passwords/",
            data={
                "password": "test",
                "is_compromised": True,
                "project": self.rebels.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_patch_passwords_without_authentication(self):
        response = self.client.patch(
            f"/api/mobile/storage/passwords/{self.rebels_password1}/",
            data={
                "password": "test",
                "is_compromised": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_patch_passwords_with_authentication(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.patch(
            f"/api/mobile/storage/passwords/{self.rebels_password1}/",
            data={
                "password": "test",
                "is_compromised": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_delete_passwords_without_authentication(self):
        response = self.client.delete(f"/api/mobile/storage/passwords/{self.rebels_password1}/")
        self.assertEqual(response.status_code, 403)

    def test_delete_passwords_with_authentication(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.delete(f"/api/mobile/storage/passwords/{self.rebels_password1}/")
        self.assertEqual(response.status_code, 403)

    def test_retrieve_passwords_without_app_id(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/mobile/storage/passwords/", data={})
        self.assertEqual(response.status_code, 400)

    def test_retrieve_passwords_with_wrong_app_id(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/mobile/storage/passwords/", data={APP_ID: "wrong"})
        self.assertEqual(response.status_code, 404)

    def test_retrieve_passwords_with_correct_app_id(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/mobile/storage/passwords/", data={APP_ID: self.rebels.app_id})
        self.assertEqual(response.status_code, 200)
        passwords = response.json()["passwords"]
        self.assertEqual(len(passwords), 3)
        self.assertEqual(passwords[0]["password"], "Truly wonderful, the mind of a child is.")
        self.assertEqual(passwords[0]["is_compromised"], False)
        self.assertEqual(passwords[1]["password"], "Try not. Do. Or do not. There is no try.")
        self.assertEqual(passwords[1]["is_compromised"], True)
        self.assertEqual(passwords[2]["password"], "Fear is the path to the dark side.")
        self.assertEqual(passwords[2]["is_compromised"], False)
