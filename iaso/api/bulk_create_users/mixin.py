import csv
import io
import logging

from collections import Counter
from enum import Enum

import pandas as pd

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import serializers

from iaso.api.bulk_create_users.constants import BULK_CREATE_USER_COLUMNS_LIST
from iaso.api.bulk_create_users.utils import (
    detect_multi_field_value_splitter_csv,
    detect_multi_field_value_splitter_xls,
)


log = logging.getLogger(__name__)


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

    @staticmethod
    def _validate_file_xlsx(value):
        try:
            pd.read_excel(value, nrows=5)
            value.seek(0)
        except ValueError:
            raise serializers.ValidationError("Invalid Excel file")

        except ImportError as e:
            log.error(f"Excel support is not installed {str(e)}")
            raise serializers.ValidationError("Invalid Excel file")

        except Exception as e:
            log.error(f"Exception while {str(e)} parsing xlsx file")
            raise serializers.ValidationError("Invalid Excel file")

    def _validate_file_xls(self, value):
        self._validate_file_xlsx(value)

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
        reader = None

        if self._file_type == BulkCreateUserSerializerFileType.CSV:
            reader = csv.DictReader(io.StringIO(value.read().decode("utf-8")), dialect=self.dialect)
            # validating columns
            missing_columns = set(BULK_CREATE_USER_COLUMNS_LIST) - set(reader.fieldnames)
            if missing_columns:
                raise serializers.ValidationError(
                    {"file_content": [{"general": f"Missing required column(s): {', '.join(sorted(missing_columns))}"}]}
                )

        elif self._file_type in [BulkCreateUserSerializerFileType.XLSX, BulkCreateUserSerializerFileType.XLS]:
            value.seek(0)

            df = pd.read_excel(value, dtype=str)

            df.columns = df.columns.str.strip()

            missing_columns = set(BULK_CREATE_USER_COLUMNS_LIST) - set(df.columns)
            reader = df.to_dict(orient="records")

            if missing_columns:
                raise serializers.ValidationError(
                    {
                        "file_content": [
                            {"general": (f"Missing required column(s): {', '.join(sorted(missing_columns))}")}
                        ]
                    }
                )

            value.seek(0)

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
        file.seek(0)

        if self._file_type == BulkCreateUserSerializerFileType.CSV:
            reader = csv.DictReader(io.StringIO(file.read().decode("utf-8")), dialect=self.dialect)
            rows = list(reader)
            for row in rows:
                if row.get("password", ""):
                    row["password"] = (
                        "*" * 6
                    )  # put 6 there so we can't guess really the password length if there is one

            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=reader.fieldnames)
            writer.writeheader()
            writer.writerows(rows)
            output.seek(0)
            return SimpleUploadedFile(
                name=file.name,
                content=output.getvalue().encode("utf-8"),
                content_type="text/csv",
            )

        if self._file_type in [BulkCreateUserSerializerFileType.XLSX, BulkCreateUserSerializerFileType.XLS]:
            df = pd.read_excel(file)

            if "password" in df.columns:
                df["password"] = df["password"].apply(
                    lambda value: ("*" * 6) if pd.notna(value) and str(value).strip() else value
                )

            output = io.BytesIO()

            filename = file.name.lower()

            if filename.endswith(".xlsx"):
                with pd.ExcelWriter(output, engine="openpyxl") as writer:
                    df.to_excel(writer, index=False)

                content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

            elif filename.endswith(".xls"):
                with pd.ExcelWriter(output, engine="xlwt") as writer:
                    df.to_excel(writer, index=False)

                content_type = "application/vnd.ms-excel"

            output.seek(0)

            return SimpleUploadedFile(
                name=file.name,
                content=output.getvalue(),
                content_type=content_type,
            )
        raise NotImplementedError

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
                            [
                                i.strip()
                                for i in v.split(
                                    detect_multi_field_value_splitter_csv(self.dialect, v)
                                    if self._file_type == BulkCreateUserSerializerFileType.CSV
                                    else detect_multi_field_value_splitter_xls(v)
                                )
                            ]
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
        file.seek(0)

        if self._file_type == BulkCreateUserSerializerFileType.CSV:
            csv_reader = csv.DictReader(file.read().decode("utf-8").splitlines(), dialect=self.dialect)
            yield from enumerate(csv_reader)
        if self._file_type in [BulkCreateUserSerializerFileType.XLS, BulkCreateUserSerializerFileType.XLSX]:
            file.seek(0)

            df = pd.read_excel(file, dtype=str)

            df = df.fillna("")

            yield from enumerate(df.to_dict(orient="records"))
