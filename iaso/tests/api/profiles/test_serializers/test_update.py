from iaso.api.profiles.serializers import ProfileUpdateSerializer
from iaso.models import Account
from iaso.test import TestCase


class ProfileUpdateSerializerTestCase(TestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.account = Account.objects.create(name="Test Account")
        cls.alice = cls.create_user_with_profile(
            username="alice", account=cls.account, first_name="Alice", last_name="Smith"
        )
        cls.bob = cls.create_user_with_profile(
            username="bob", account=cls.account, first_name="Bob", last_name="Wilson"
        )
        cls.admin = cls.create_user_with_profile(
            username="admin",
            account=cls.account,
            first_name="Admin",
            last_name="User",
            is_staff=True,
            is_superuser=True,
        )

    def test_update_profile_to_existing_username_should_fail(self):
        """Test that changing username to an existing one (case-insensitive) fails correctly."""

        # Try to change bob's username to "Alice"
        bob_profile = self.bob.iaso_profile
        data = {
            "user_name": "Alice",
            "first_name": "Bob Updated",
        }

        serializer = ProfileUpdateSerializer(data=data, instance=bob_profile)
        self.assertFalse(serializer.is_valid())

        self.assertIn("user_name", serializer.errors)
        self.assertEqual("Username already exists", serializer.errors["user_name"][0])

    def test_update_username_to_existing_case_variation_should_fail(self):
        """Test that changing username to case variation of another user's username fails."""
        self.create_user_with_profile(
            username="Alice", account=self.account, first_name="Alice Upper", last_name="Jones"
        )  # with a capital A

        alice_lower_profile = self.alice.iaso_profile
        data = {
            "user_name": "Alice",  # with a capital A
            "first_name": "Alice Changed",
        }

        serializer = ProfileUpdateSerializer(data=data, instance=alice_lower_profile)
        self.assertFalse(serializer.is_valid())

        self.assertIn("user_name", serializer.errors)
        self.assertEqual("Username already exists", serializer.errors["user_name"][0])
