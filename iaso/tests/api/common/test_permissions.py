from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory

from iaso.api.common.permissions import HasAccountFeatureFlag
from iaso.models import Account, AccountFeatureFlag
from iaso.test import TestCase


class TestHasAccountFeatureFlagPermission(TestCase):
    def setUp(self):
        super().setUp()
        self.account = Account.objects.create(name="account")
        self.account_feature_flag_1 = AccountFeatureFlag.objects.create(name="ff", code="ff")
        self.account_feature_flag_2 = AccountFeatureFlag.objects.create(name="ff2", code="ff2")

    def test_unauthenticated_user_is_rejected(self):
        request = RequestFactory()
        request.user = AnonymousUser()

        self.assertFalse(HasAccountFeatureFlag("a")().has_permission(request, None))

    def test_superuser_is_approved(self):
        request = RequestFactory()
        user = get_user_model().objects.create_user(is_superuser=True, email="", password="", username="superuser")
        request.user = user
        self.assertTrue(HasAccountFeatureFlag("a")().has_permission(request, None))

    def test_authenticated_user_without_iaso_profile_is_rejected(self):
        request = RequestFactory()
        user = get_user_model().objects.create_user(is_superuser=False, email="", password="", username="normaluser")
        request.user = user
        self.assertFalse(HasAccountFeatureFlag("a")().has_permission(request, None))

    def test_no_feature_flags(self):
        request = RequestFactory()
        request.user = self.create_user_with_profile(
            username="normaluser", password="password", email="email", account=self.account
        )

        self.assertTrue(HasAccountFeatureFlag()().has_permission(request, None))

    def test_one_feature_flag(self):
        request = RequestFactory()
        user = self.create_user_with_profile(
            username="normaluser", password="password", email="email", account=self.account
        )
        request.user = user

        self.assertFalse(HasAccountFeatureFlag(self.account_feature_flag_1.code)().has_permission(request, None))

        self.account.feature_flags.add(self.account_feature_flag_2.code)

        self.assertFalse(HasAccountFeatureFlag(self.account_feature_flag_1.code)().has_permission(request, None))
        self.assertTrue(HasAccountFeatureFlag(self.account_feature_flag_2.code)().has_permission(request, None))

    def test_multiple_feature_flags(self):
        request = RequestFactory()
        user = self.create_user_with_profile(
            username="normaluser", password="password", email="email", account=self.account
        )
        request.user = user

        self.assertFalse(
            HasAccountFeatureFlag(self.account_feature_flag_1.code, self.account_feature_flag_2.code)().has_permission(
                request, None
            )
        )

        self.account.feature_flags.add(self.account_feature_flag_2.code)

        self.assertFalse(
            HasAccountFeatureFlag(self.account_feature_flag_1.code, self.account_feature_flag_2.code)().has_permission(
                request, None
            )
        )

        self.account.feature_flags.add(self.account_feature_flag_1.code)

        self.assertTrue(
            HasAccountFeatureFlag(self.account_feature_flag_1.code, self.account_feature_flag_2.code)().has_permission(
                request, None
            )
        )
