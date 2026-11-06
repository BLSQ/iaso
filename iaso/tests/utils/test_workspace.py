from django.contrib.auth.models import AnonymousUser
from django.http import Http404
from django.test import RequestFactory

from iaso.models import Account, Workspace
from iaso.test import TestCase
from iaso.utils.workspace import get_active_workspace


class GetActiveWorkspaceTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="Account")
        cls.workspace = Workspace.objects.create(account=cls.account, name="First workspace")
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

    def build_request(self, user):
        request = RequestFactory().get("/")
        request.user = user
        return request

    def test_returns_the_workspace_of_the_user_account(self):
        other_account = Account.objects.create(name="Other account")
        Workspace.objects.create(account=other_account, name="Other workspace")

        self.assertEqual(get_active_workspace(self.build_request(self.user)), self.workspace)

    def test_caches_the_workspace_on_the_request(self):
        request = self.build_request(self.user)
        get_active_workspace(request)

        with self.assertNumQueries(0):
            self.assertEqual(get_active_workspace(request), self.workspace)

    def test_ignores_soft_deleted_workspaces(self):
        self.workspace.delete()

        with self.assertRaises(Http404):
            get_active_workspace(self.build_request(self.user))

    def test_raises_404_when_account_has_no_workspace(self):
        account_without_workspace = Account.objects.create(name="No workspace")
        user = self.create_user_with_profile(username="lonely", account=account_without_workspace)

        with self.assertRaises(Http404):
            get_active_workspace(self.build_request(user))

    def test_raises_404_for_user_without_profile(self):
        with self.assertRaises(Http404):
            get_active_workspace(self.build_request(AnonymousUser()))
