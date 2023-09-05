from iaso import models as m
from iaso.test import APITestCase


class ApiDhis2ouimporterTestCase(APITestCase):
    @classmethod
    def setUp(cls):
        cls.account = account = m.Account.objects.create(name="test account")
        cls.user = cls.create_user_with_profile(username="test user", account=account, permissions=["iaso_sources"])

    def test_no_perm(self):
        source = m.DataSource.objects.create(name="test source")
        user_no_perm = self.create_user_with_profile(username="test user2", account=self.account, permissions=[])
        self.client.force_authenticate(user_no_perm)
        response = self.client.post(
            "/api/dhis2ouimporter/",
            format="json",
            data={
                "source_id": source.id,
                "source_version_number": 1,
            },
        )
        jr = self.assertJSONResponse(response, 403)
        self.assertEqual({"detail": "You do not have permission to perform this action."}, jr)

    def test_no_perm_source(self):
        source = m.DataSource.objects.create(name="test source")
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/dhis2ouimporter/",
            format="json",
            data={
                "source_id": source.id,
                "source_version_number": 1,
            },
        )
        jr = self.assertJSONResponse(response, 400)
        self.assertEqual({"non_field_errors": ["Unauthorized source_id"]}, jr)

    def test_ok(self):
        project = m.Project.objects.create(name="test proj", app_id="app_id", account=self.account)
        credentials = m.ExternalCredentials.objects.create(
            url="url", login="login", password="pwd", account=self.account
        )
        source = m.DataSource.objects.create(name="test source", credentials=credentials)
        source.projects.add(project)

        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/dhis2ouimporter/",
            format="json",
            data={
                "source_id": source.id,
                "source_version_number": 1,
            },
        )
        jr = self.assertJSONResponse(response, 200)
        task = self.assertValidTaskAndInDB(jr)
        self.assertEqual(task.launcher, self.user)
        self.assertEqual(task.params["kwargs"]["source_id"], source.id)
        self.assertEqual(task.params["kwargs"]["url"], None)
        self.assertEqual(task.params["kwargs"]["login"], None)
        self.assertEqual(task.params["kwargs"]["password"], None)

    def test_not_ok_incomplete_credentials(self):
        project = m.Project.objects.create(name="test proj", app_id="app_id", account=self.account)
        # missing login
        credentials = m.ExternalCredentials.objects.create(url="url", login="", password="pwd", account=self.account)
        source = m.DataSource.objects.create(name="test source", credentials=credentials)
        source.projects.add(project)

        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/dhis2ouimporter/",
            format="json",
            data={
                "source_id": source.id,
                "source_version_number": 1,
            },
        )
        jr = self.assertJSONResponse(response, 400)
        self.assertEqual({"non_field_errors": ["No valid credentials exist for this source, please provide them"]}, jr)

    def test_pass_credentials(self):
        project = m.Project.objects.create(name="test proj", app_id="app_id", account=self.account)

        source = m.DataSource.objects.create(name="test source")
        source.projects.add(project)

        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/dhis2ouimporter/",
            format="json",
            data={
                "source_id": source.id,
                "source_version_number": 1,
                "dhis2_url": "overid url",
                "dhis2_login": "overid login",
                "dhis2_password": "overid pwd",
            },
        )
        jr = self.assertJSONResponse(response, 200)
        self.assertValidTaskAndInDB(jr)

    def test_override_credentials(self):
        project = m.Project.objects.create(name="test proj", app_id="app_id", account=self.account)
        credentials = m.ExternalCredentials.objects.create(
            url="url", login="login", password="pwd", account=self.account
        )
        source = m.DataSource.objects.create(name="test source", credentials=credentials)
        source.projects.add(project)

        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/dhis2ouimporter/",
            format="json",
            data={
                "source_id": source.id,
                "source_version_number": 1,
                "dhis2_url": "override url",
                "dhis2_login": "override login",
                "dhis2_password": "override pwd",
            },
        )
        jr = self.assertJSONResponse(response, 200)
        task = self.assertValidTaskAndInDB(jr)
        self.assertEqual(task.launcher, self.user)
        self.assertEqual(task.params["kwargs"]["source_id"], source.id)
        self.assertEqual(task.params["kwargs"]["url"], "override url")
        self.assertEqual(task.params["kwargs"]["login"], "override login")
        self.assertEqual(task.params["kwargs"]["password"], "override pwd")

    def test_override_credentials_bad(self):
        """Document bad behaviour, if we only pass some credentials we accept it but we are not going to use it"""
        project = m.Project.objects.create(name="test proj", app_id="app_id", account=self.account)
        credentials = m.ExternalCredentials.objects.create(
            url="url", login="login", password="pwd", account=self.account
        )
        source = m.DataSource.objects.create(name="test source", credentials=credentials)
        source.projects.add(project)

        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/dhis2ouimporter/",
            format="json",
            data={
                "source_id": source.id,
                "source_version_number": 1,
                "dhis2_url": "override url",
                "dhis2_password": "override pwd",
            },
        )
        jr = self.assertJSONResponse(response, 200)
        task = self.assertValidTaskAndInDB(jr)
        self.assertEqual(task.launcher, self.user)
        self.assertEqual(task.params["kwargs"]["source_id"], source.id)
        self.assertEqual(task.params["kwargs"]["url"], "override url")
        self.assertEqual(task.params["kwargs"]["login"], None)
        self.assertEqual(task.params["kwargs"]["password"], "override pwd")
