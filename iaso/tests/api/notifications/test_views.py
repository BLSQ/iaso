from datetime import datetime, timedelta

from hat.api_import.models import APIImport
from iaso import test
from iaso.models import Account, Project


class TestNotificationsViewSet(test.APITestCase):
    def setUp(self):
        self.account1 = account1 = Account.objects.create(name="account1")
        self.account2 = account2 = Account.objects.create(name="account2")

        self.project1 = Project.objects.create(name="project1", app_id="P1", account=account1)
        self.project2 = Project.objects.create(name="project2", app_id="P2", account=account2)

        self.staff = staff = self.create_user_with_profile(username="staff", account=account1, permissions=[])
        staff.is_staff = True
        staff.save()
        self.superuser = superuser = self.create_user_with_profile(
            username="superuser", account=account1, permissions=[]
        )
        superuser.is_superuser = True
        superuser.save()
        self.user = self.create_user_with_profile(username="user", account=account1, permissions=[])

    def test_get_notifications_anonymously(self):
        response = self.client.get("/api/notifications/")
        self.assertJSONResponse(response, 401)

    def test_get_notifications_user(self):
        APIImport.objects.create(app_id="P1", has_problem=True, json_body={})
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/notifications/")
        json_response = self.assertJSONResponse(response, 200)
        self.assertEqual(len(json_response), 0)

    def test_get_notifications_superuser_problem_in_account(self):
        APIImport.objects.create(app_id="P1", has_problem=True, json_body={})
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get("/api/notifications/")
        json_response = self.assertJSONResponse(response, 200)
        self.assertEqual(len(json_response), 1)

    def test_get_notifications_superuser_problem_in_other_account(self):
        APIImport.objects.create(app_id="P2", has_problem=True, json_body={})
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get("/api/notifications/")
        json_response = self.assertJSONResponse(response, 200)
        self.assertEqual(len(json_response), 0)

    def test_get_notifications_staff_problem_in_account(self):
        APIImport.objects.create(app_id="P1", has_problem=True, json_body={})
        self.client.force_authenticate(user=self.staff)
        response = self.client.get("/api/notifications/")
        json_response = self.assertJSONResponse(response, 200)
        self.assertEqual(len(json_response), 1)

    def test_get_notifications_staff_problem_in_other_account(self):
        APIImport.objects.create(app_id="P2", has_problem=True, json_body={})
        self.client.force_authenticate(user=self.staff)
        response = self.client.get("/api/notifications/")
        json_response = self.assertJSONResponse(response, 200)
        self.assertEqual(len(json_response), 1)

    def test_get_notifications_staff_problem_not_older_than_30_days(self):
        apiimport = APIImport.objects.create(app_id="P1", has_problem=True, json_body={})
        apiimport.created_at = datetime.now() - timedelta(days=28)
        apiimport.save()
        self.client.force_authenticate(user=self.staff)
        response = self.client.get("/api/notifications/")
        json_response = self.assertJSONResponse(response, 200)
        self.assertEqual(len(json_response), 1)

    def test_get_notifications_staff_problem_older_than_30_days(self):
        apiimport = APIImport.objects.create(app_id="P1", has_problem=True, json_body={})
        apiimport.created_at = datetime.now() - timedelta(days=31)
        apiimport.save()
        self.client.force_authenticate(user=self.staff)
        response = self.client.get("/api/notifications/")
        json_response = self.assertJSONResponse(response, 200)
        self.assertEqual(len(json_response), 0)
