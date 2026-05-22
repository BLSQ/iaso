import typing

from cryptography.fernet import Fernet
from django.conf import settings
from django.db import models


class EncryptedTextField(models.TextField):
    description = "A Fernet-encrypted text field"

    def from_db_value(
        self,
        value: typing.Optional[str],
        expression: typing.Optional[str],
        connection: typing.Any,
    ) -> typing.Optional[str]:
        if value is None:
            return value

        return Fernet(settings.ENCRYPTED_TEXT_FIELD_KEY).decrypt(value.encode("utf-8")).decode("utf-8")

    def get_db_prep_value(
        self,
        value: typing.Optional[str],
        connection: typing.Any,
        prepared: bool = False,
    ) -> typing.Optional[str]:
        db_prep_value = super().get_db_prep_value(value, connection, prepared)
        if db_prep_value is None:
            return None

        return Fernet(settings.ENCRYPTED_TEXT_FIELD_KEY).encrypt(value.encode("utf-8")).decode("utf-8")
