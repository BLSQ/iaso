import csv
import io

from collections import Counter
from enum import Enum

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import serializers

from iaso.api.bulk_create_users.constants import BULK_CREATE_USER_COLUMNS_LIST
from iaso.api.bulk_create_users.utils import detect_multi_field_value_splitter


class BulkCreateUserSerializerFileType(Enum):
    CSV = "csv"
    XLS = "xls"
    XLSX = "xlsx"


class BulkCreateUserSerializerFileMixin(serializers.Serializer):
    _file_type = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # get file_type
        if self.initial_data.get("file"):
            self._file_type = self._get_file_type(self.initial_data.get("file").name)

    @staticmethod
    def _get_file_type(value):
        if value.endswith(".csv"):
            return BulkCreateUserSerializerFileType.CSV
        if value.endswith(".xlsx"):
            return BulkCreateUserSerializerFileType.XLSX
        if value.endswith(".xls"):
            return BulkCreateUserSerializerFileType.XLS
        raise serializers.ValidationError({"file": "Invalid file type"})

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs.get("file"):
            self._validate_file_content(attrs["file"])
        return attrs

    def _validate_file_csv(self, value):
        try:
            decoded = value.readline().decode("utf-8")
            value.seek(0)

            self.dialect = csv.Sniffer().sniff(decoded, delimiters=";,|")

        except UnicodeDecodeError:
            raise serializers.ValidationError("Invalid file encoding")
        except csv.Error:
            raise serializers.ValidationError("Invalid CSV file")

    def _validate_file_xlsx(self, value):
        raise NotImplementedError

    def _validate_file_xls(self, value):
        raise NotImplementedError

    def validate_file(self, value):
        if value:
            if self._file_type == BulkCreateUserSerializerFileType.CSV:
                self._validate_file_csv(value)
            if self._file_type == BulkCreateUserSerializerFileType.XLSX:
                self._validate_file_xlsx(value)
            if self._file_type == BulkCreateUserSerializerFileType.XLS:
                self._validate_file_xls(value)
        return value

    def _validate_file_content(self, value):
        reader = csv.DictReader(io.StringIO(value.read().decode("utf-8")), dialect=self.dialect)
        # validating columns
        missing_columns = set(BULK_CREATE_USER_COLUMNS_LIST) - set(reader.fieldnames)
        if missing_columns:
            raise serializers.ValidationError(
                {"file_content": [{"general": f"Missing required column(s): {', '.join(sorted(missing_columns))}"}]}
            )

        self._validate_file_content_users(reader)

        return value

    def _validate_file_content_users(self, user_data):
        # Get existing data for uniqueness checks
        usernames = [data.get("username") for data in user_data if data.get("username")]

        if len(set(usernames)) != len(usernames):
            raise serializers.ValidationError(
                {
                    "file_content": [
                        {
                            "general": f"Duplicates in usernames: {', '.join([item for item, count in Counter(usernames).items() if count > 1])}"
                        }
                    ]
                }
            )

        return user_data

    def _filter_out_sensitive_data(self, file):
        if self._file_type == BulkCreateUserSerializerFileType.CSV:
            file.seek(0)
            reader = csv.DictReader(io.StringIO(file.read().decode("utf-8")), dialect=self.dialect)
            for row in reader:
                if row.get("password", ""):
                    row["password"] = (
                        "*" * 6
                    )  # put 6 there so we can't guess really the password length if there is one

            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=reader.fieldnames)
            writer.writeheader()
            writer.writerows(list(reader))
            output.seek(0)
            return SimpleUploadedFile(
                name=file.name,
                content=output.getvalue().encode("utf-8"),
                content_type="text/csv",
            )
        if (
            self._file_type == BulkCreateUserSerializerFileType.XLSX
            or self._file_type == BulkCreateUserSerializerFileType.XLS
        ):
            pass

    def _pre_process_row(self, row):
        """
        Split the values by delimiter if needed
        Transform the integer strings into real integers
        """

        for k, v in list(row.items()):
            if k in [
                "teams",
                "permissions",
                "user_roles",
                "orgunit",
                "projects",
                "orgunit__source_ref",
                "editable_org_unit_types",
            ]:
                row[k] = list(
                    map(
                        lambda x: int(x) if isinstance(x, str) and x.isdigit() else x,
                        filter(
                            lambda x: bool(x),
                            [i.strip() for i in v.split(detect_multi_field_value_splitter(self.dialect, v))]
                            if isinstance(v, str)
                            else (v or []),
                        ),
                    )
                )
            if k in ["profile_language"]:
                if v:
                    row[k] = v.lower()  # e.g to map FR to fr
        return {k: v for k, v in row.items() if v}

    def get_data_from_file(self, file):
        if self._file_type == BulkCreateUserSerializerFileType.CSV:
            file.seek(0)
            csv_reader = csv.DictReader(file.read().decode("utf-8").splitlines(), dialect=self.dialect)
            yield from enumerate(csv_reader)
