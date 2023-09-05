from django.contrib.contenttypes.models import ContentType

from iaso import models as m
from iaso.test import APITestCase


class CommentApiTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        account = m.Account(name="test account")
        source = m.DataSource.objects.create(name="test source")
        cls.source = source

        version = m.SourceVersion.objects.create(data_source=source, number=1)
        account.default_version = version
        account.save()
        project = m.Project.objects.create(name="test project", account=account)
        source.projects.add(project)

        cls.account = account

        cls.orgunit = m.OrgUnit.objects.create(version=version)

        cls.user = user = m.User.objects.create(username="link")
        p = m.Profile(user=user, account=account)
        p.save()

        # admin = m.User.objects.create_superuser(username="zelda", password="tiredofplayingthesameagain")
        # cls.admin = admin

    def test_setupaccount_unauth_post(self):
        response = self.client.post("/api/comments/", data={}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_setupaccount_unauth_list(self):
        response = self.client.get("/api/comments/", format="json")
        self.assertEqual(response.status_code, 403)

    def test_setupaccount_post_no_perm(self):
        account = m.Account.objects.create(name="test account #2")
        bad_user = self.create_user_with_profile(username="bad_user", account=account)

        self.client.force_authenticate(bad_user)
        data = {"comment": "comment", "content_type": "iaso-orgunit", "object_pk": self.orgunit.pk}

        response = self.client.post("/api/comments/", data=data, format="json")
        self.assertEqual(response.status_code, 403, response.content)

    def test_post_not_orgunit(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/comments/",
            format="json",
            data={
                "comment": "comment",
                "content_type": "iaso-group",
                "object_pk": self.orgunit.pk,
            },
        )
        self.assertEqual(response.status_code, 400, response.content)
        r = response.json()
        self.assertIn("non_field_errors", r)
        self.assertEqual(r["non_field_errors"], ["only comment on OrgUnit are accepted for now"])

    def test_setupaccount_post(self):
        self.client.force_authenticate(self.user)

        ct = ContentType.objects.get_for_model(m.OrgUnit)
        data = {"comment": "my comment", "content_type": "iaso-orgunit", "object_pk": self.orgunit.pk}

        response = self.client.post("/api/comments/", data=data, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertIn("id", response.json())

        # Attempt to reread it
        response = self.client.get(
            "/api/comments/", data={"content_type": "iaso-orgunit", "object_pk": self.orgunit.pk}, format="json"
        )
        self.assertEqual(response.status_code, 200, response.content)
        comments = response.json()
        self.assertEqual(len(comments), 1)
        c = comments[0]
        self.assertEqual(c["parent"], None)
        self.assertEqual(c["user"]["username"], "link")
        self.assertEqual(c["children"], [])
        self.assertEqual(c["object_pk"], str(self.orgunit.pk))

        # Create another user in account and see if he can read it
        good_user = self.create_user_with_profile(username="good_user", account=self.account)
        self.client.force_authenticate(good_user)

        response = self.client.get(
            "/api/comments/", data={"content_type": "iaso-orgunit", "object_pk": self.orgunit.pk}, format="json"
        )
        self.assertEqual(response.status_code, 200, response.content)
        comments = response.json()
        self.assertEqual(len(comments), 1)
        c = comments[0]
        self.assertEqual(c["parent"], None)
        self.assertEqual(c["user"]["username"], "link")
        self.assertEqual(c["children"], [])
        self.assertEqual(c["object_pk"], str(self.orgunit.pk))

        # That other user can leave a child comment on it
        response = self.client.post(
            "/api/comments/",
            format="json",
            data={
                "parent": c["id"],
                "comment": "reply comment",
                "content_type": "iaso-orgunit",
                "object_pk": self.orgunit.pk,
            },
        )
        self.assertEqual(response.status_code, 201, response.content)
        self.assertIn("id", response.json())

        # we can see it
        response = self.client.get(
            "/api/comments/", data={"content_type": "iaso-orgunit", "object_pk": self.orgunit.pk}, format="json"
        )
        self.assertEqual(response.status_code, 200, response.content)
        comments = response.json()
        self.assertEqual(len(comments), 1)
        c = comments[0]
        self.assertEqual(c["parent"], None)
        self.assertEqual(c["user"]["username"], "link")
        self.assertEqual(c["object_pk"], str(self.orgunit.pk))
        self.assertEqual(len(c["children"]), 1)
        child = c["children"][0]
        self.assertEqual(child["user"]["username"], "good_user")
        self.assertEqual(child["comment"], "reply comment")
        self.assertEqual(child["object_pk"], str(self.orgunit.pk))

        # that child  cannot have a reply
        response = self.client.post(
            "/api/comments/",
            format="json",
            data={
                "parent": child["id"],
                "comment": "reply comment",
                "content_type": ct.id,
                "object_pk": self.orgunit.pk,
            },
        )
        self.assertEqual(response.status_code, 400, response.content)
