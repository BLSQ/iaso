import csv
import io

import pandas as pd
from django.contrib.auth.models import User, Permission
from django.contrib.auth.password_validation import validate_password
from django.core import validators
from django.core.exceptions import ValidationError, ObjectDoesNotExist, MultipleObjectsReturned
from django.core.files.base import ContentFile
from django.db import IntegrityError, transaction
from rest_framework import serializers, permissions
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from drf_yasg.utils import swagger_auto_schema, no_body
from rest_framework.decorators import action
from django.http import FileResponse

from beanstalk_worker import task_decorator
from iaso.api.tasks import TaskSerializer
from iaso.models import BulkCreateUserCsvFile, Profile, OrgUnit, ERRORED


@task_decorator(task_name="bulk_create_users")
def bulk_create_users_task(file, user, launch_task):
    request_user = user
    user_access_ou = OrgUnit.objects.filter_for_user_and_app_id(request_user, None)
    user_created_count = 0
    running_task = request_user

    if launch_task:
        try:
            running_task.report_progress_and_stop_if_killed(
                progress_value=user_created_count, progress_message=_("Starting")
            )
        except UnicodeDecodeError as e:
            running_task.status = ERRORED
            running_task.result = {"message": e}
            running_task.save()
            raise serializers.ValidationError({"error": f"Operation aborted. Error: {e}"})
    user_csv = file
    user_csv_decoded = user_csv.read().decode("utf-8")
    csv_str = io.StringIO(user_csv_decoded)
    reader = csv.reader(csv_str)
    i = 0
    csv_indexes = []
    file_instance = BulkCreateUserCsvFile.objects.create(
        file=user_csv, created_by=request_user, account=request_user.iaso_profile.account
    )
    file_instance.save()
    for row in reader:
        if launch_task:
            running_task.report_progress_and_stop_if_killed(progress_message=_("Creating users"))
        org_units_list = []
        if i > 0:
            email_address = True if row[csv_indexes.index("email")] else None
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
                                "error": "Operation aborted. Multiple OrgUnits with the name: {0} at row : {1}."
                                "Use Orgunit ID instead of name.".format(ou, i + 1)
                            }

                        except Exception as e:
                            return {
                                "error": "Operation aborted. Invalid OrgUnit {0} at row : {1}. Fix "
                                "the error "
                                "and try "
                                "again. Use Orgunit ID instead of name.".format(ou, i + 1)
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
            csv_file = pd.read_csv(io.StringIO(file_instance.file.read().decode("utf-8")), delimiter=",")
            csv_file.at[i - 1, "password"] = ""
            csv_file = csv_file.to_csv(path_or_buf=None, index=False)
            content_file = ContentFile(csv_file.encode("utf-8"))
            file_instance.file.save(f"{file_instance.id}.csv", content_file)
            profile.save()
            user_created_count += 1
        else:
            csv_indexes = row
        i += 1

    if launch_task:
        running_task.report_success(message="%d user created." % user_created_count)

    return {"Accounts created": user_created_count}


class BulkCreateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkCreateUserCsvFile
        fields = ["file"]
        read_only_fields = ["created_by", "created_at", "account"]


class HasUserPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.has_perm("menupermissions.iaso_users"):
            return False
        return True


class BulkCreateUserFromCsvViewSet(ModelViewSet):
    """Api endpoint to bulkcreate users and profiles from a CSV File.

    Sample csv input:

    username,password,email,first_name,last_name,orgunit,profile_language,permissions

    simon,sim0nrule2,biobroly@bluesquarehub.com,Simon,D.,KINSHASA,fr,"iaso_submissions, iaso_forms"

    Email is not mandatory, but you must keep the email column.

    You can add multiples permissions for the same user : "iaso_submissions, iaso_forms"

    The permissions are :

    "iaso_forms",

    "iaso_submissions",

    "iaso_mappings",

    "iaso_completeness",

    "iaso_org_units",

    "iaso_links",

    "iaso_users",

    "iaso_projects",

    "iaso_sources",

    "iaso_data_tasks",
    """

    result_key = "file"
    remove_results_key_if_paginated = True
    permission_classes = [HasUserPermission]

    def get_serializer_class(self):
        return BulkCreateUserSerializer

    def get_queryset(self):
        queryset = BulkCreateUserCsvFile.objects.none()

        return queryset

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        user = request.user
        file = request.FILES["file"]
        task = bulk_create_users_task(file=file, user=user, launch_task=True)  # type: ignore

        return Response({"task": TaskSerializer(instance=task).data})
