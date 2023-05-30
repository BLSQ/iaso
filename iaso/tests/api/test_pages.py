from django.utils.timezone import now

from iaso import models as m
from iaso.models import Page
from iaso.test import APITestCase


class PagesAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        kame_house = m.Account.objects.create(name="Kame House")
        konoa = m.Account.objects.create(name="Konoa")

        cls.goku = cls.create_user_with_profile(username="Goku", account=kame_house)
        cls.kefla = cls.create_user_with_profile(username="Kefla", account=kame_house)
        cls.kakashin = cls.create_user_with_profile(username="Kakashi", account=konoa)

        cls.sayen = m.OrgUnitType.objects.create(name="Sayen", short_name="Sy")

    def test_create_page(self):
        self.client.force_login(self.goku)

        response = self.client.post(
            "/api/pages/",
            data={
                "type": "RAW",
                "needs_authentication": "false",
                "name": "TEST16",
                "slug": "test16",
                "content": "test",
                "users": [self.goku.pk],
            },
            format="json",
        )

        self.client.force_login(self.kakashin)

        self.client.post(
            "/api/pages/",
            data={
                "type": "RAW",
                "needs_authentication": "true",
                "name": "TEST2",
                "slug": "test2",
                "content": "test",
                "users": [self.kakashin.pk],
            },
            format="json",
        )

        self.assertJSONResponse(response, 201)

    def test_access_anonymous_page_same_account(self):
        self.client.force_login(self.kefla)

        self.client.post(
            "/api/pages/",
            data={
                "type": "RAW",
                "needs_authentication": "false",
                "name": "TEST16",
                "slug": "test16",
                "content": "test",
                "users": [self.goku.pk],
            },
            format="json",
        )

        self.client.post(
            "/api/pages/",
            data={
                "type": "RAW",
                "needs_authentication": "true",
                "name": "TEST2",
                "slug": "test2",
                "content": "test",
                "users": [self.kakashin.pk],
            },
            format="json",
        )

        response = self.client.get("/api/pages/?limit=10&page=1&order=-updated_at", format="json")

        all_pages = Page.objects.all()

        self.assertEqual(len(all_pages), 2)
        self.assertEqual(response.data["count"], 1)

    def test_update_page(self):
        self.client.force_login(self.goku)

        self.client.post(
            "/api/pages/",
            data={
                "type": "RAW",
                "needs_authentication": "false",
                "name": "TEST1",
                "slug": "test1",
                "content": "test",
                "users": [self.goku.pk],
            },
            format="json",
        )

        page = Page.objects.last().pk

        response = self.client.put(
            "/api/pages/{0}/".format(page),
            data={
                "type": "RAW",
                "needs_authentication": "true",
                "name": "TEST1",
                "slug": "testT1",
                "content": "test",
                "users": [self.goku.pk],
            },
            format="json",
        )

        self.assertJSONResponse(response, 200)

    def test_page_delete(self):
        self.client.force_login(self.goku)

        self.client.post(
            "/api/pages/",
            data={
                "type": "RAW",
                "needs_authentication": "false",
                "name": "TEST1",
                "slug": "test1",
                "content": "test",
                "users": [self.goku.pk],
            },
            format="json",
        )

        page = Page.objects.last().pk

        response = self.client.delete(
            "/api/pages/{0}/".format(page),
            data={
                "type": "RAW",
                "needs_authentication": "false",
                "name": "TEST1",
                "slug": "test1",
                "content": "test",
                "users": [self.goku.pk],
            },
            format="json",
        )
        self.assertJSONResponse(response, 204)
