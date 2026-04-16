from django.test import RequestFactory

from iaso.api.bulk_create_users.serializers import BulkCreateItemSerializer
from iaso.models import Account
from iaso.test import TestCase


class Test(TestCase):
    def setUp(self):
        account = Account.objects.create(name="account")
        self.user = self.create_user_with_profile(username="test", account=account)
        request = RequestFactory()
        request.user = self.user
        self.context = {"request": request}

    def test_valid_phone_number(self):
        phone_number = "+12345678912"
        expected_output = "+12345678912"
        serializer = BulkCreateItemSerializer(data={"phone_number": phone_number}, context=self.context)

        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertNotIn("phone_number", serializer.errors)

        self.assertEqual(serializer.validate_phone_number(phone_number), expected_output)

    def test_invalid_phone_number(self):
        invalid_phone_number = "+12345"

        serializer = BulkCreateItemSerializer(data={"phone_number": invalid_phone_number}, context=self.context)

        self.assertFalse(serializer.is_valid(raise_exception=False))

        self.assertIn("phone_number", serializer.errors)

        self.assertEqual(serializer.errors["phone_number"][0].code, "invalid")
        self.assertEqual(serializer.errors["phone_number"][0], "Invalid phone number: +12345")

    def test_number_parse_exception(self):
        phone_number = "This is not a phone number"

        serializer = BulkCreateItemSerializer(data={"phone_number": phone_number}, context=self.context)

        self.assertFalse(serializer.is_valid(raise_exception=False))

        self.assertIn("phone_number", serializer.errors)

        self.assertEqual(serializer.errors["phone_number"][0].code, "invalid")
        self.assertEqual(
            serializer.errors["phone_number"][0], "Invalid phone number format: This is not a phone number"
        )
