from datetime import datetime

from rest_framework import status

from hat.api_import.models import APIImport
from iaso.models import Account, Project
from iaso.permissions.core_permissions import CORE_ACCOUNT_MANAGEMENT_PERMISSION
from iaso.test import APITestCase


class APIImportViewSetTest(APITestCase):
    BASE_URL = "/api/api_import/"

    def setUp(self):
        super().setUp()
        self.account1 = account1 = Account.objects.create(name="account1")
        self.account2 = account2 = Account.objects.create(name="account2")

        self.project1 = Project.objects.create(name="project1", app_id="P1", account=account1)
        self.project2 = Project.objects.create(name="project2", app_id="P2", account=account2)

        self.staff = self.create_user_with_profile(
            username="staff", account=account1, permissions=[], is_staff=True, is_superuser=True
        )
        self.user_with_permission = self.create_user_with_profile(
            username="user.with.permissions",
            account=account1,
            permissions=[CORE_ACCOUNT_MANAGEMENT_PERMISSION],
        )
        self.user = user = self.create_user_with_profile(username="user", account=account1, permissions=[])

        apiimport = APIImport.objects.create(
            app_id=self.project1.app_id, json_body={}, has_problem=True, user=user, import_type="orgUnit"
        )
        apiimport.created_at = datetime(2026, 4, 7)
        apiimport.save()
        apiimport = APIImport.objects.create(
            app_id=self.project1.app_id, json_body={}, has_problem=False, import_type="instance"
        )
        apiimport.created_at = datetime(2026, 4, 8)
        apiimport.save()
        apiimport = APIImport.objects.create(
            app_id=self.project1.app_id, json_body={}, has_problem=False, import_type="bulk"
        )
        apiimport.created_at = datetime(2026, 4, 9)
        apiimport.save()
        apiimport = APIImport.objects.create(
            app_id=self.project2.app_id, json_body={}, has_problem=False, user=user, import_type="bulk"
        )
        apiimport.created_at = datetime(2026, 4, 10)
        apiimport.save()
        apiimport = APIImport.objects.create(
            app_id=self.project2.app_id, json_body={}, has_problem=False, import_type="orgUnit"
        )
        apiimport.created_at = datetime(2026, 4, 11)
        apiimport.save()
        apiimport = APIImport.objects.create(
            app_id=self.project2.app_id, json_body={}, has_problem=False, import_type="instance"
        )
        apiimport.created_at = datetime(2026, 4, 12)
        apiimport.save()

    def test_retrieve_anonymous(self):
        response = self.client.get(f"{self.BASE_URL}1/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_anonymous(self):
        response = self.client.get(self.BASE_URL)
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_get_simple_user(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.BASE_URL)
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_get_user_with_permission(self):
        self.client.force_authenticate(self.user_with_permission)
        response = self.client.get(self.BASE_URL)
        json_response = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(json_response["count"], 3)  # only the ones from their account

    def test_get_staff(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(self.BASE_URL)
        json_response = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(json_response["count"], 6)  # all of them

    def test_get_filter_app_id(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(f"{self.BASE_URL}?app_id={self.project1.app_id}")
        json_response = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(json_response["count"], 3)

    def test_get_filter_from_date(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(f"{self.BASE_URL}?from_date=2026-04-09")
        json_response = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(json_response["count"], 4)

    def test_get_filter_to_date(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(f"{self.BASE_URL}?to_date=2026-04-09")
        json_response = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(json_response["count"], 3)

    def test_get_filter_has_problem(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(f"{self.BASE_URL}?has_problem=true")
        json_response = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(json_response["count"], 1)

    def test_get_filter_import_type(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(f"{self.BASE_URL}?import_type=bulk")
        json_response = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(json_response["count"], 2)

    def test_get_filter_user_id(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(f"{self.BASE_URL}?user_id={self.user.id}")
        json_response = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(json_response["count"], 2)
        self.assertEqual(json_response["results"][0]["user"]["id"], self.user.id)
        self.assertEqual(json_response["results"][0]["user"]["username"], self.user.get_username())
        self.assertEqual(json_response["results"][0]["import_type"], "orgUnit")
        self.assertEqual(json_response["results"][0]["has_problem"], True)
        self.assertEqual(json_response["results"][1]["user"]["id"], self.user.id)
        self.assertEqual(json_response["results"][1]["user"]["username"], self.user.get_username())
        self.assertEqual(json_response["results"][1]["import_type"], "bulk")
        self.assertEqual(json_response["results"][1]["has_problem"], False)
