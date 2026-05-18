from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory

from iaso.api.common.permissions import HasModulePermission
from iaso.models import Account
from iaso.modules import IasoModule
from iaso.test import TestCase


class TestHasModulePermission(TestCase):
    def setUp(self):
        super().setUp()
        self.account = Account.objects.create(name="account")
        self.module_1 = IasoModule(name="Module 1", codename="MODULE_1", fr_name="Modules")
        self.module_2 = IasoModule(name="Module 2", codename="MODULE_2", fr_name="Modules")

    def test_unauthenticated_user_is_rejected(self):
        request = RequestFactory()
        request.user = AnonymousUser()

        self.assertFalse(HasModulePermission("a")().has_permission(request, None))

    def test_authenticated_user_without_iaso_profile_is_rejected(self):
        request = RequestFactory()
        user = get_user_model().objects.create_user(is_superuser=False, email="", password="", username="normaluser")
        request.user = user
        self.assertFalse(HasModulePermission("a")().has_permission(request, None))

    def test_no_modules(self):
        request = RequestFactory()
        request.user = self.create_user_with_profile(
            username="normaluser", password="password", email="email", account=self.account
        )

        self.assertTrue(HasModulePermission()().has_permission(request, None))

    def test_one_module(self):
        request = RequestFactory()
        user = self.create_user_with_profile(
            username="normaluser", password="password", email="email", account=self.account
        )
        request.user = user

        self.assertFalse(HasModulePermission(self.module_1)().has_permission(request, None))

        self.account.modules = [self.module_1.codename]
        self.account.save()

        self.assertFalse(HasModulePermission(self.module_2)().has_permission(request, None))
        self.assertTrue(HasModulePermission(self.module_1)().has_permission(request, None))

    def test_multiple_feature_flags(self):
        request = RequestFactory()
        user = self.create_user_with_profile(
            username="normaluser", password="password", email="email", account=self.account
        )
        request.user = user

        self.assertFalse(HasModulePermission(self.module_1, self.module_2)().has_permission(request, None))

        self.account.modules = [self.module_2.codename]
        self.account.save()

        self.assertFalse(HasModulePermission(self.module_1, self.module_2)().has_permission(request, None))

        self.account.modules = [self.module_2.codename, self.module_1.codename]
        self.account.save()

        self.assertTrue(HasModulePermission(self.module_1, self.module_2)().has_permission(request, None))
