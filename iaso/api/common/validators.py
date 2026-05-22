import os

import jsonschema
import magic

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class JSONSchemaFieldValidator:
    message = _("Invalid data for schema: %(error)s")
    code = "schema_validation_error"

    def __init__(self, schema, message=None, code=None):
        if not schema:
            raise ValueError("A JSON schema must be provided for validation.")
        try:
            self.schema_validator = jsonschema.validators.validator_for(schema)
            self.schema_validator.check_schema(schema)
            self.schema_validator = self.schema_validator(schema)
        except jsonschema.exceptions.SchemaError as e:
            raise ValueError(f"Invalid JSON Schema: {e.message}")

        if message:
            self.message = message
        if code:
            self.code = code

    def __call__(self, value):
        if value is None or value == "":
            return

        try:
            self.schema_validator.validate(value)
        except jsonschema.exceptions.ValidationError as e:
            raise ValidationError(self.message, code=self.code, params={"error": e.message})


# libmagic may report OOXML spreadsheets as application/zip when too few bytes are read.
# python-magic recommends at least 2048; 4096 covers macOS libmagic on typical .xlsx files.
FILE_TYPE_MAGIC_BUFFER_SIZE = 4096

# libmagic often returns these for valid csv/xlsx/xls; use the file extension as a fallback.
AMBIGUOUS_MIMETYPES = frozenset(
    {
        "application/zip",
        "application/octet-stream",
        "application/cdfv2",
    }
)

EXTENSION_CANONICAL_MIMETYPES = {
    "csv": ("text/csv", "text/plain"),
    "xlsx": ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",),
    "xls": ("application/vnd.ms-excel",),
}


class FileTypeValidator:
    message = _("Unsupported file type.")
    code = "invalid_file_type"

    def __init__(self, allowed_mimetypes=None, message=None, code=None):
        if allowed_mimetypes is not None:
            allowed_mimetypes = [allowed_mimetype.lower() for allowed_mimetype in allowed_mimetypes]
        self.allowed_mimetypes = allowed_mimetypes

        if message is not None:
            self.message = message
        if code is not None:
            self.code = code

    def __call__(self, value):
        value.seek(0)
        file_mime_type = self._detect_mime_type(value)
        value.seek(0)
        if file_mime_type in self.allowed_mimetypes:
            return
        if self._extension_fallback_allows(value, file_mime_type):
            return
        raise ValidationError(code=self.code, message=self.message)

    def _detect_mime_type(self, value):
        temporary_file_path = getattr(value, "temporary_file_path", None)
        if callable(temporary_file_path):
            try:
                return magic.from_file(temporary_file_path(), mime=True).lower()
            except (NotImplementedError, AttributeError):
                pass

        value.seek(0)
        file_mime_type = magic.from_buffer(value.read(FILE_TYPE_MAGIC_BUFFER_SIZE), mime=True).lower()
        value.seek(0)
        return file_mime_type

    def _extension_fallback_allows(self, value, detected_mime_type):
        if detected_mime_type not in AMBIGUOUS_MIMETYPES:
            return False

        file_name = getattr(value, "name", "") or ""
        extension = os.path.splitext(file_name)[1].lower().lstrip(".")
        canonical_mimetypes = EXTENSION_CANONICAL_MIMETYPES.get(extension)
        if not canonical_mimetypes:
            return False

        return any(canonical_mime in self.allowed_mimetypes for canonical_mime in canonical_mimetypes)
