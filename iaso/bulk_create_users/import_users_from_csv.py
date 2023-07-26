import csv
import io
import re

import pandas as pd
from django.contrib.auth.models import User, Permission
from django.contrib.auth.password_validation import validate_password
from django.core import validators
from django.core.exceptions import ObjectDoesNotExist
from django.core.files.base import ContentFile
from django.db import transaction
from rest_framework import serializers

from django.utils.translation import gettext as _

from beanstalk_worker import task_decorator
from iaso.models import BulkCreateUserCsvFile, Profile, OrgUnit, ERRORED


@transaction.atomic
# @task_decorator(task_name="bulk_create_users")
def bulk_create_users(user_id=None, file_id=None, launch_task=None, task=None, user=None):
    columns_list = [
        "username",
        "password",
        "email",
        "first_name",
        "last_name",
        "orgunit",
        "profile_language",
        "dhis2_id",
        "permissions",
        "user_role",
    ]
    request_user = User.objects.get(pk=user_id)
    print("REQ: ", request_user)
    user_access_ou = OrgUnit.objects.filter_for_user_and_app_id(request_user, None)
    user_created_count = 0
    file_instance = BulkCreateUserCsvFile.objects.get(pk=file_id)
    csv_decoded = file_instance.file.read().decode("utf-8")
    csv_str = io.StringIO(csv_decoded, newline="")
    the_task = task
    if launch_task:
        try:
            the_task.report_progress_and_stop_if_killed(
                progress_value=user_created_count, progress_message=_("Starting")
            )
        except UnicodeDecodeError as e:
            the_task.status = ERRORED
            the_task.result = {"message": e}
            the_task.save()

            raise serializers.ValidationError({"error": f"Operation aborted. Error: {e}"})

    # Check the validity and delimiters of the CSV

    try:
        delimiter = csv.Sniffer().sniff(csv_decoded).delimiter
    except csv.Error:
        try:
            delimiter = ";" if ";" in csv_decoded else ","
        except Exception as e:
            raise serializers.ValidationError({"error": f"Error: CSV bad format {e}"})
    delimiter = delimiter.strip()
    csv_str.seek(0)
    csv_lines = csv_decoded.splitlines()
    reader = [line.split(delimiter) for line in csv_lines]

    csv_indexes = []
    file_instance = BulkCreateUserCsvFile.objects.create(
        file=file_instance.file, created_by=request_user, account=request_user.iaso_profile.account
    )
    file_instance.save()
    for i, row in enumerate(reader):

        index_list = []
        element_dict = dict()
        try:
            for index, e in enumerate(row):
                if e.startswith('"') or e.endswith('"'):
                    element_dict[index] = e
                    if len(element_dict) >= 2:
                        for num in range(min(element_dict.keys()), max(element_dict.keys())):
                            if num not in element_dict:
                                element_dict[num] = row[num]

        except Exception as e:
            print(e)

        if len(element_dict) > 0:
            element_dict = {k: v.strip('"').replace('"', "") for k, v in element_dict.items()}
            replacement_string = ""
            for k, v in element_dict.items():
                if v.startswith(" "):
                    v = v[1:]
                replacement_string = replacement_string + v + ","

            replacement_string = replacement_string[:-1]

            try:
                row[min(element_dict.keys())] = replacement_string
            except Exception as e:
                print(e)

            print("elem dict X: ", element_dict)

            for k, v in element_dict.items():
                index_list.append(k)

            for p, e in enumerate(row):
                if min(index_list) < p <= max(index_list):
                    del row[min(index_list) + 1]

            print(index_list)
            print("ELEMENT DICT: ", element_dict)
            print(replacement_string)
            print(row)

        if launch_task:
            the_task.report_progress_and_stop_if_killed(progress_message=_("Creating users"))
        if i > 0 and not set(columns_list).issubset(csv_indexes):
            missing_elements = set(columns_list) - set(csv_indexes)
            raise serializers.ValidationError(
                {
                    "error": f"Something is wrong with your CSV File. Possibly missing {missing_elements} column(s)."
                    f" Your columns: {csv_indexes}"
                    f"Expected columns: {columns_list}"
                }
            )
        org_units_list = []
        if i > 0:
            email_address = True if row[csv_indexes.index("email")] else None
            print("EMAIL")
            if email_address:
                try:
                    try:
                        validators.validate_email(row[csv_indexes.index("email")])
                    except Exception as e:
                        return {
                            "error": f"Email Column Missing. Email column is required even if you don't provide an email address. Error code: {e}"
                        }

                except Exception as e:
                    return {
                        "error": f"Operation aborted. Invalid Email at row : {i}. Fix the error and try "
                        f"again. Error code :{e} "
                    }

            try:
                try:
                    created_user = User.objects.create(
                        username=row[csv_indexes.index("username")],
                        first_name=row[csv_indexes.index("first_name")],
                        last_name=row[csv_indexes.index("last_name")],
                        email=row[csv_indexes.index("email")],
                    )
                    print("CREE USER")
                    validate_password(row[csv_indexes.index("password")], user)
                    created_user.set_password(row[csv_indexes.index("password")])
                    created_user.save()
                except Exception as e:
                    return {"error": f"Operation aborted. Error at row {i + 1}. {e}"}

            except Exception as e:
                row_error = row[csv_indexes.index("username")]

                return {
                    "error": f"Operation aborted. Error at row {i} Account already exists : {row_error}. Fix the "
                    "error and try "
                    "again. "
                    f"Error details: {e}"
                }

            org_units = row[csv_indexes.index("orgunit")]
            if org_units:
                org_units = org_units.split(",")
                for ou in org_units:
                    ou = ou[1::] if ou[:1] == " " else ou
                    try:
                        if int(ou):
                            try:
                                ou = OrgUnit.objects.get(id=ou)
                                print("OU 1")
                                if ou not in user_access_ou:
                                    raise serializers.ValidationError(
                                        {
                                            "error": "Operation aborted. Invalid OrgUnit {0} at row : {1}. "
                                            "You don't have access to this orgunit".format(ou, i + 1)
                                        }
                                    )
                                org_units_list.append(ou)
                            except Exception as e:
                                return {
                                    "error": f"Operation aborted. Invalid OrgUnit {ou} at row : {i + 1}. "
                                    "Fix the error "
                                    "and try "
                                    "again. "
                                    f"Error code: {e}"
                                }

                    except ValueError:
                        try:
                            org_unit = OrgUnit.objects.get(name=ou)
                            if org_unit not in OrgUnit.objects.filter_for_user_and_app_id(request_user, None):
                                raise serializers.ValidationError(
                                    {
                                        "error": "Operation aborted. Invalid OrgUnit {0} at row : {1}. "
                                        "You don't have access to this orgunit".format(ou, i + 1)
                                    }
                                )
                            org_units_list.append(org_unit)
                        except Exception as e:
                            return {
                                "error": "Operation aborted. Invalid OrgUnit {0} at row : {1}. Fix "
                                "the error "
                                "and try "
                                "again.".format(ou, i + 1)
                            }

            profile = Profile.objects.create(account=request_user.iaso_profile.account, user=created_user)
            try:
                user_permissions = row[csv_indexes.index("permissions")].split(",")
                for perm in user_permissions:
                    perm = perm[1::] if perm[:1] == " " else perm
                    if perm:
                        try:
                            perm = Permission.objects.get(codename=perm)
                            created_user.user_permissions.add(perm)
                            created_user.save()
                        except ObjectDoesNotExist:
                            raise serializers.ValidationError(
                                {
                                    "error": "Operation aborted. Invalid permission {0} at row : {1}. Fix "
                                    "the error "
                                    "and try "
                                    "again".format(perm, i + 1)
                                }
                            )
            except ValueError:
                pass
            if row[csv_indexes.index("profile_language")]:
                language = row[csv_indexes.index("profile_language")].lower()
                profile.language = language
            else:
                profile.language = "fr"
            profile.org_units.set(org_units_list)
            # csv_file = pd.read_csv(io.BytesIO(csv_str.getvalue().encode()))
            # csv_file.at[i - 1, "password"] = None
            # csv_file = csv_file.to_csv(path_or_buf=None, index=False)
            # content_file = ContentFile(csv_file.encode("utf-8"))
            # file_instance.file.save(f"{file_instance.id}.csv", content_file)
            profile.save()
            user_created_count += 1
        else:
            csv_indexes = row
        i += 1

    if launch_task:
        the_task.report_success(message="%d user created." % user_created_count)

    return user_created_count
