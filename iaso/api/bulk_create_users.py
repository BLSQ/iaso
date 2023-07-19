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

from iaso.models import BulkCreateUserCsvFile, Profile, OrgUnit, UserRole


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

    Mandatory columns are : ["username", "password", "email", "first_name", "last_name", "orgunit", "profile_language", "dhis2_id", "projects", "permissions", "user_roles"]

    Email, dhis2_id, permissions, profile_language and org_unit are not mandatory, but you must keep the columns.

    Sample csv input:

    username,password,email,first_name,last_name,orgunit,profile_language,permissions,dhis2_id,user_role

    john,j0hnDoei5f@mous#,johndoe@bluesquarehub.com,John,D.,KINSHASA,fr,"iaso_submissions, iaso_forms",Enc73jC3, manager

    You can add multiples permissions for the same user : "iaso_submissions, iaso_forms"
    You can add multiples org_units for the same user by ID or Name : "28334, Bas Uele, 9999"

    It's a better practice and less error-prone to use org_units IDs instead of names.


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
        user_created_count = 0
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
            "user_roles",
        ]
        if request.FILES:
            user_access_ou = OrgUnit.objects.filter_for_user_and_app_id(request.user, None)

            # Retrieve and check the validity and format of the CSV File
            try:
                user_csv = request.FILES["file"]
                user_csv_decoded = user_csv.read().decode("utf-8")
                csv_str = io.StringIO(user_csv_decoded)

                try:
                    delimiter = csv.Sniffer().sniff(user_csv_decoded).delimiter
                except csv.Error:
                    try:
                        delimiter = ";" if ";" in user_csv.decoded else ","
                    except Exception:
                        raise serializers.ValidationError({"error": "Error : CSV File incorrectly formatted."})

                reader = csv.reader(csv_str, delimiter=delimiter)
                pd.read_csv(io.BytesIO(csv_str.getvalue().encode()))
            except UnicodeDecodeError as e:
                raise serializers.ValidationError({"error": f"Operation aborted. Error: {e}"})
            except pd.errors.ParserError as e:
                raise serializers.ValidationError({"error": f"Invalid CSV File. Error: {e}"})
            csv_indexes = []
            file_instance = BulkCreateUserCsvFile.objects.create(
                file=user_csv, created_by=request.user, account=request.user.iaso_profile.account
            )
            file_instance.save()

            for i, row in enumerate(reader):
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
                user_roles_list = []
                if i > 0:
                    email_address = True if row[csv_indexes.index("email")] else None
                    if email_address:
                        try:
                            validators.validate_email(row[csv_indexes.index("email")])
                        except ValidationError:
                            raise serializers.ValidationError(
                                {
                                    "error": "Operation aborted. Invalid Email at row : {0}. Fix the error and try "
                                    "again.".format(i)
                                }
                            )
                    try:
                        try:
                            user = User.objects.create(
                                username=row[csv_indexes.index("username")],
                                first_name=row[csv_indexes.index("first_name")],
                                last_name=row[csv_indexes.index("last_name")],
                                email=row[csv_indexes.index("email")],
                            )
                            validate_password(row[csv_indexes.index("password")], user)
                            user.set_password(row[csv_indexes.index("password")])
                            user.save()
                        except ValidationError as e:
                            raise serializers.ValidationError(
                                {"error": "Operation aborted. Error at row %d. %s" % (i + 1, "; ".join(e.messages))}
                            )
                    except IntegrityError:
                        raise serializers.ValidationError(
                            {
                                "error": "Operation aborted. Error at row {0} Account already exists : {1}. Fix the "
                                "error and try "
                                "again.".format(i, row[csv_indexes.index("username")])
                            }
                        )
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
                                    except ObjectDoesNotExist:
                                        raise serializers.ValidationError(
                                            {
                                                "error": "Operation aborted. Invalid OrgUnit {0} at row : {1}. "
                                                "Fix the error "
                                                "and try "
                                                "again.".format(ou, i + 1)
                                            }
                                        )
                            except ValueError:
                                try:
                                    org_unit = OrgUnit.objects.get(name=ou)
                                    if org_unit not in OrgUnit.objects.filter_for_user_and_app_id(request.user, None):
                                        raise serializers.ValidationError(
                                            {
                                                "error": "Operation aborted. Invalid OrgUnit {0} at row : {1}. "
                                                "You don't have access to this orgunit".format(ou, i + 1)
                                            }
                                        )
                                    org_units_list.append(org_unit)
                                except MultipleObjectsReturned:
                                    raise serializers.ValidationError(
                                        {
                                            "error": "Operation aborted. Multiple OrgUnits with the name: {0} at row : {1}."
                                            "Use Orgunit ID instead of name.".format(ou, i + 1)
                                        }
                                    )
                                except ObjectDoesNotExist:
                                    raise serializers.ValidationError(
                                        {
                                            "error": "Operation aborted. Invalid OrgUnit {0} at row : {1}. Fix "
                                            "the error "
                                            "and try "
                                            "again. Use Orgunit ID instead of name.".format(ou, i + 1)
                                        }
                                    )
                    profile = Profile.objects.create(account=request.user.iaso_profile.account, user=user)
                    # Using try except for dhis2_id in case users are being created with an older version of the template
                    try:
                        dhis2_id = row[csv_indexes.index("dhis2_id")]
                    except ValueError:
                        dhis2_id = None
                    if dhis2_id:
                        # check if a profile with the same dhis_id already exists
                        if Profile.objects.filter(dhis2_id=dhis2_id).count() > 0:
                            raise serializers.ValidationError(
                                {
                                    "error": f"Operation aborted. User with same dhis_2 id already exists at row : { i + 1}. Fix "
                                    "the error "
                                    "and try "
                                    "again"
                                }
                            )

                        profile.dhis2_id = dhis2_id
                    try:
                        user_roles = row[csv_indexes.index("user_roles")]
                    except (IndexError, ValueError):
                        user_roles = None
                    if user_roles:
                        user_roles = user_roles.split(",")
                        # check if the roles exists in the account of the request user
                        # and add it to user_roles_list
                        for role in user_roles:
                            if role != "":
                                role = role[1::] if role[:1] == " " else role
                                try:
                                    role_instance = UserRole.objects.get(
                                        account=request.user.iaso_profile.account, group__name=role
                                    )
                                    user_roles_list.append(role_instance)
                                except ObjectDoesNotExist:
                                    raise serializers.ValidationError(
                                        {
                                            "error": f"Error. User Role: {role}, at row {i + 1} does not exists: Fix "
                                            "the error and try again."
                                        }
                                    )
                    try:
                        user_permissions = row[csv_indexes.index("permissions")].split(",")
                        for perm in user_permissions:
                            perm = perm[1::] if perm[:1] == " " else perm
                            if perm:
                                try:
                                    perm = Permission.objects.get(codename=perm)
                                    user.user_permissions.add(perm)
                                    user.save()
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
                    profile.user_roles.set(user_roles_list)
                    csv_file = pd.read_csv(io.BytesIO(csv_str.getvalue().encode()))
                    csv_file.at[i - 1, "password"] = None
                    csv_file = csv_file.to_csv(path_or_buf=None, index=False)
                    content_file = ContentFile(csv_file.encode("utf-8"))
                    file_instance.file.save(f"{file_instance.id}.csv", content_file)
                    profile.save()
                    user_created_count += 1
                else:
                    csv_indexes = row
                i += 1
        response = {"Accounts created": user_created_count}
        return Response(response)

    @swagger_auto_schema(request_body=no_body)
    @action(detail=False, methods=["get"], url_path="getsample")
    def download_sample_csv(self, request):
        return FileResponse(open("iaso/api/fixtures/sample_bulk_user_creation.csv", "rb"))
