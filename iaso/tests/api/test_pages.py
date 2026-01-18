from django.utils.timezone import now

from iaso import models as m
from iaso.models import Page
from iaso.permissions.core_permissions import CORE_PAGE_WRITE_PERMISSION, CORE_PAGES_PERMISSION
from iaso.test import APITestCase


class PagesAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        first_account = m.Account.objects.create(name="First account")
        second_account = m.Account.objects.create(name="Second account")

        cls.first_user = cls.create_user_with_profile(
            username="firstUser", account=first_account, permissions=[CORE_PAGE_WRITE_PERMISSION]
        )
        cls.second_user = cls.create_user_with_profile(
            username="secondUser", account=first_account, permissions=[CORE_PAGE_WRITE_PERMISSION]
        )
        cls.third_user = cls.create_user_with_profile(
            username="thirdUser", account=second_account, permissions=[CORE_PAGE_WRITE_PERMISSION]
        )
        cls.fourth_user = cls.create_user_with_profile(
            username="fourth user", account=first_account, permissions=[CORE_PAGE_WRITE_PERMISSION]
        )
        cls.fifth_user = cls.create_user_with_profile(
            username="fifth user", account=first_account, permissions=[CORE_PAGE_WRITE_PERMISSION]
        )
        cls.user_no_write_permission = cls.create_user_with_profile(
            username="NoWritePermission", account=first_account, permissions=[CORE_PAGES_PERMISSION]
        )
        cls.user_no_iaso_pages_permission = cls.create_user_with_profile(
            username="userNoIasoPagesPermission", account=first_account
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
        self.client.force_login(self.user_no_iaso_pages_permission)

        response = self.client.get("/api/pages/")
        self.assertJSONResponse(response, 403)

    def test_pages_list_linked_to_current_user(self):
        """Get /pages/ only pages linked to the current user"""
        self.create_page(name="TEST1", slug="test_1", needs_authentication=False, users=[self.second_user.pk])
        self.create_page(name="TEST2", slug="test_2", needs_authentication=True, users=[self.second_user.pk])

        # Check when the user has only read permission but not embedded links linked to him
        self.client.force_login(self.user_no_write_permission)
        response = self.client.get("/api/pages/")
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.json()["results"]), 0)

        # Check when the user has only read permission but has some embedded links linked to him
        self.create_page(
            name="TEST3", slug="test_3", needs_authentication=True, users=[self.user_no_write_permission.pk]
        )
        self.client.force_login(self.user_no_write_permission)
        response = self.client.get("/api/pages/")
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.json()["results"]), 1)

        # Check when the user has write permission
        self.client.force_login(self.first_user)
        response = self.client.get("/api/pages/")
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.json()["results"]), 3)

    def test_pages_list_search_by_name_or_by_slug(self):
        """GET /pages/?search='search string'"""
        self.client.force_login(self.first_user)
        page1 = self.create_page(name="TEST1", slug="test_1", needs_authentication=False, users=[self.second_user.pk])
        page2 = self.create_page(name="TEST2", slug="test_2", needs_authentication=True, users=[self.second_user.pk])

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
        self.client.force_login(self.first_user)
        page1 = self.create_page(name="TEST1", slug="test_1", needs_authentication=False, users=[self.second_user.pk])
        self.create_page(name="TEST2", slug="test_2", needs_authentication=True, users=[self.fourth_user.pk])

        response = self.client.get("/api/pages/?needs_authentication=false")
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.json()["results"]), 1)
        self.assertEqual(response.json()["results"][0]["name"], page1.name)

    def test_pages_list_filter_by_users(self):
        """GET /pages/?userId=user Id"""
        self.client.force_login(self.first_user)

        self.create_page(name="TEST1", slug="test_1", needs_authentication=False, users=[self.second_user.pk])
        page2 = self.create_page(
            name="TEST2", slug="test_2", needs_authentication=True, users=[self.second_user.pk, self.fifth_user.pk]
        )
        self.create_page(name="TEST3", slug="test_3", needs_authentication=True, users=[self.fourth_user.pk])

        response = self.client.get("/api/pages/?userId=" + str(self.fifth_user.pk))
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.json()["results"]), 1)
        self.assertEqual(response.json()["results"][0]["id"], page2.id)

    def test_create_page_with_no_write_permission(self):
        """POST /pages/ without write page permission should result in a 403"""
        self.client.force_login(self.user_no_write_permission)

        response = self.client.post(
            "/api/pages/",
            data={
                "type": "RAW",
                "needs_authentication": "false",
                "name": "TEST16",
                "slug": "test16",
                "content": "test",
                "users": [self.first_user.pk],
            },
            format="json",
        )

        self.assertJSONResponse(response, 403)

    def test_page_delete_without_write_permission(self):
        """DELETE /pages/page_id without write page permission should result in a 403"""
        self.client.force_login(self.first_user)

        self.client.post(
            "/api/pages/",
            data={
                "type": "RAW",
                "needs_authentication": "false",
                "name": "TEST1",
                "slug": "test1",
                "content": "test",
                "users": [self.first_user.pk],
            },
            format="json",
        )

        self.client.force_login(self.user_no_write_permission)
        page = Page.objects.last().pk

        response = self.client.delete(
            f"/api/pages/{page}/",
            data={
                "type": "RAW",
                "needs_authentication": "false",
                "name": "TEST1",
                "slug": "test1",
                "content": "test",
                "users": [self.first_user.pk],
            },
            format="json",
        )
        self.assertJSONResponse(response, 403)

    def test_create_page(self):
        self.client.force_login(self.first_user)

        response = self.client.post(
            "/api/pages/",
            data={
                "type": "RAW",
                "needs_authentication": "false",
                "name": "TEST16",
                "slug": "test16",
                "content": "test",
                "users": [self.first_user.pk],
            },
            format="json",
        )

        self.client.force_login(self.third_user)

        self.client.post(
            "/api/pages/",
            data={
                "type": "RAW",
                "needs_authentication": "true",
                "name": "TEST2",
                "slug": "test2",
                "content": "test",
                "users": [self.third_user.pk],
            },
            format="json",
        )

        self.assertJSONResponse(response, 201)

    def test_access_anonymous_page_same_account(self):
        self.client.force_login(self.second_user)

        self.client.post(
            "/api/pages/",
            data={
                "type": "RAW",
                "needs_authentication": "false",
                "name": "TEST16",
                "slug": "test16",
                "content": "test",
                "users": [self.first_user.pk],
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
                "users": [self.third_user.pk],
            },
            format="json",
        )

        response = self.client.get("/api/pages/?limit=10&page=1&order=-updated_at", format="json")

        all_pages = Page.objects.all()

        self.assertEqual(len(all_pages), 2)
        self.assertEqual(response.data["count"], 1)

    def test_update_page(self):
        self.client.force_login(self.first_user)

        self.client.post(
            "/api/pages/",
            data={
                "type": "RAW",
                "needs_authentication": "false",
                "name": "TEST1",
                "slug": "test1",
                "content": "test",
                "users": [self.first_user.pk],
            },
            format="json",
        )

        page = Page.objects.last().pk

        response = self.client.put(
            f"/api/pages/{page}/",
            data={
                "type": "RAW",
                "needs_authentication": "true",
                "name": "TEST1",
                "slug": "testT1",
                "content": "test",
                "users": [self.first_user.pk],
            },
            format="json",
        )

        self.assertJSONResponse(response, 200)

    def test_page_delete(self):
        self.client.force_login(self.first_user)

        self.client.post(
            "/api/pages/",
            data={
                "type": "RAW",
                "needs_authentication": "false",
                "name": "TEST1",
                "slug": "test1",
                "content": "test",
                "users": [self.first_user.pk],
            },
            format="json",
        )

        page = Page.objects.last().pk

        response = self.client.delete(
            f"/api/pages/{page}/",
            data={
                "type": "RAW",
                "needs_authentication": "false",
                "name": "TEST1",
                "slug": "test1",
                "content": "test",
                "users": [self.first_user.pk],
            },
            format="json",
        )
        self.assertJSONResponse(response, 204)
