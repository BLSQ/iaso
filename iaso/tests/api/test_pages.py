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

        cls.goku = cls.create_user_with_profile(username="Goku", account=kame_house, permissions=["iaso_page_write"])
        cls.kefla = cls.create_user_with_profile(username="Kefla", account=kame_house, permissions=["iaso_page_write"])
        cls.kakashin = cls.create_user_with_profile(username="Kakashi", account=konoa, permissions=["iaso_page_write"])
        cls.fourth_user = cls.create_user_with_profile(
            username="fourth user", account=kame_house, permissions=["iaso_page_write"]
        )
        cls.fifth_user = cls.create_user_with_profile(
            username="fifth user", account=kame_house, permissions=["iaso_page_write"]
        )
        cls.userNoWritePermission = cls.create_user_with_profile(
            username="NoWritePermission", account=kame_house, permissions=["iaso_pages"]
        )
        cls.userNoIasoPagesPermission = cls.create_user_with_profile(
            username="userNoIasoPagesPermission", account=kame_house
        )

        cls.sayen = m.OrgUnitType.objects.create(name="Sayen", short_name="Sy")

    def create_page(self, name, slug, needs_authentication, users=None):
        """Helper method to create a Page and associate it with users."""
        page = Page.objects.create(
            type="RAW",
            needs_authentication=needs_authentication,
            name=name,
            slug=slug,
            content="test",
        )
        if users:
            page.users.set(users)
        return page

    def test_pages_list_without_auth(self):
        """GET /pages/ without auth should result in a 401"""

        response = self.client.get("/api/pages/")
        self.assertJSONResponse(response, 401)

    def test_pages_list_without_pages_permission(self):
        """GET /pages/ without iaso_pages permission should result in a 403"""
        self.client.force_login(self.userNoIasoPagesPermission)

        response = self.client.get("/api/pages/")
        self.assertJSONResponse(response, 403)

    def test_pages_list_search_by_name_or_by_slug(self):
        """GET /pages/?search='search string'"""
        self.client.force_login(self.goku)
        page1 = self.create_page(name="TEST1", slug="test_1", needs_authentication=False, users=[self.kefla.pk])
        page2 = self.create_page(name="TEST2", slug="test_2", needs_authentication=True, users=[self.kefla.pk])

        response = self.client.get("/api/pages/?search=Test1")
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.json()["results"]), 1)
        self.assertEqual(page1.name, "TEST1")

        response = self.client.get("/api/pages/?search=Test_2")
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.json()["results"]), 1)
        self.assertEqual(response.json()["results"][0]["name"], page2.name)

    def test_pages_list_filter_by_needs_authentication(self):
        """GET /pages/?needs_authentication=boolean"""
        self.client.force_login(self.goku)
        page1 = self.create_page(name="TEST1", slug="test_1", needs_authentication=False, users=[self.kefla.pk])
        self.create_page(name="TEST2", slug="test_2", needs_authentication=True, users=[self.fourth_user.pk])

        response = self.client.get("/api/pages/?needs_authentication=false")
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.json()["results"]), 1)
        self.assertEqual(response.json()["results"][0]["name"], page1.name)

    def test_pages_list_filter_by_users(self):
        """GET /pages/?userIds=coma separate userIds"""
        self.client.force_login(self.goku)

        self.create_page(name="TEST1", slug="test_1", needs_authentication=False, users=[self.kefla.pk])
        page2 = self.create_page(
            name="TEST2", slug="test_2", needs_authentication=True, users=[self.kefla.pk, self.fifth_user.pk]
        )
        page3 = self.create_page(name="TEST3", slug="test_3", needs_authentication=True, users=[self.fourth_user.pk])

        response = self.client.get("/api/pages/?userIds=" + str(self.fifth_user.pk) + "," + str(self.fourth_user.pk))
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.json()["results"]), 2)
        self.assertEqual(sorted([page["id"] for page in response.json()["results"]]), sorted([page2.id, page3.id]))

    def test_create_page_with_no_write_permission(self):
        """POST /pages/ without write page permission should result in a 403"""
        self.client.force_login(self.userNoWritePermission)

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

        self.assertJSONResponse(response, 403)

    def test_page_delete_without_write_permission(self):
        """DELETE /pages/page_id without write page permission should result in a 403"""
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

        self.client.force_login(self.userNoWritePermission)
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
        self.assertJSONResponse(response, 403)

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
