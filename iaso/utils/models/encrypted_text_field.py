import typing

from cryptography.fernet import Fernet
from django.conf import settings
from django.db import models


class EncryptedTextField(models.TextField):
    description = "A Fernet-encrypted text field"

    def from_db_value(
        self,
        value: str | None,
        expression: str | None,
        connection: typing.Any,
    ) -> str | None:
        if value is None:
            return value

        return Fernet(settings.ENCRYPTED_TEXT_FIELD_KEY).decrypt(value.encode("utf-8")).decode("utf-8")

    def get_db_prep_value(
        self,
        value: str | None,
        connection: typing.Any,
        prepared: bool = False,
    ) -> str | None:
        db_prep_value = super().get_db_prep_value(value, connection, prepared)
        if db_prep_value is None:
            return None

        return Fernet(settings.ENCRYPTED_TEXT_FIELD_KEY).encrypt(value.encode("utf-8")).decode("utf-8")
