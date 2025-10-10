from cryptography.fernet import Fernet
from django.conf import settings
from django.db import connection

from iaso.test import TestCase
from iaso.utils.models.encrypted_text_field import EncryptedTextField


class EncryptedTextFieldTest(TestCase):
    def test_encrypted_field_get_db_prep_value(self):
        field = EncryptedTextField()
        self.assertNotEqual("john123", field.get_db_prep_value("john123", connection=connection))

    def test_encrypted_field_get_db_prep_value_none(self):
        field = EncryptedTextField()
        self.assertEqual(None, field.get_db_prep_value(None, connection=connection))

    def test_encrypted_field_from_db_value(self):
        field = EncryptedTextField()
        self.assertEqual(
            "john123",
            field.from_db_value(
                Fernet(settings.ENCRYPTED_TEXT_FIELD_KEY).encrypt(b"john123").decode("utf-8"),
                expression=None,
                connection=connection,
            ),
        )

    def test_encrypted_field_from_db_value_none(self):
        field = EncryptedTextField()
        self.assertEqual(None, field.from_db_value(None, expression=None, connection=connection))
