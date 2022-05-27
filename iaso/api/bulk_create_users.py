from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError, ObjectDoesNotExist, MultipleObjectsReturned
from django.db import IntegrityError, transaction
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework import serializers, status, permissions
from django.core import validators
import csv
import pandas as pd

from iaso.models import BulkCreateUserCsvFile, Profile, Account, OrgUnit


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
    """Api endpoint to bulkcreate users and profiles from a CSV File."""

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
        if request.FILES:
            user_csv = request.FILES["file"]
            file_instance = BulkCreateUserCsvFile.objects.create(
                file=user_csv, created_by=request.user, account=request.user.iaso_profile.account
            )
            file_instance.save()
            file = open(file_instance.file.path, "r", encoding="utf-8")
            reader = csv.reader(file)
            i = 0
            csv_indexes = []
            for row in reader:
                org_units_list = []
                if i > 0:
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
                        except ValidationError as e:
                            raise serializers.ValidationError(
                                {
                                    "error": "Operation aborted. Error at row %d. %s" % (i, '; '.join(e.messages))
                                }
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
                                        if ou not in OrgUnit.objects.filter_for_user_and_app_id(request.user, None):
                                            raise serializers.ValidationError(
                                                {
                                                    "error": "Operation aborted. Invalid OrgUnit {0} at row : {1}. "
                                                    "You don't have access to this orgunit".format(ou, i)
                                                }
                                            )
                                        org_units_list.append(ou)
                                    except ObjectDoesNotExist:
                                        raise serializers.ValidationError(
                                            {
                                                "error": "Operation aborted. Invalid OrgUnit {0} at row : {1}. "
                                                "Fix the error "
                                                "and try "
                                                "again.".format(ou, i)
                                            }
                                        )
                            except ValueError:
                                try:
                                    org_unit = OrgUnit.objects.get(name=ou)
                                    if org_unit not in OrgUnit.objects.filter_for_user_and_app_id(request.user, None):
                                        raise serializers.ValidationError(
                                            {
                                                "error": "Operation aborted. Invalid OrgUnit {0} at row : {1}. "
                                                "You don't have access to this orgunit".format(ou, i)
                                            }
                                        )
                                    org_units_list.append(org_unit)
                                except MultipleObjectsReturned:

                                    raise serializers.ValidationError(
                                        {
                                            "error": "Operation aborted. Multiple OrgUnits with the name: {0} at row : {1}."
                                            "Use Orgunit ID instead of name.".format(ou, i)
                                        }
                                    )
                                except ObjectDoesNotExist:
                                    raise serializers.ValidationError(
                                        {
                                            "error": "Operation aborted. Invalid OrgUnit {0} at row : {1}. Fix "
                                            "the error "
                                            "and try "
                                            "again. Use Orgunit ID instead of name.".format(ou, i)
                                        }
                                    )
                    user.save()
                    profile = Profile.objects.create(account=request.user.iaso_profile.account, user=user)
                    if row[csv_indexes.index("profile_language")]:
                        language = row[csv_indexes.index("profile_language")].lower()
                        profile.language = language
                    else:
                        profile.language = "fr"
                    profile.org_units.set(org_units_list)
                    csv_file = pd.read_csv(file_instance.file.path)
                    csv_file.at[i - 1, "password"] = ""
                    csv_file.to_csv(file_instance.file.path, index=False)
                else:
                    csv_indexes = row
                i += 1
            file.close()
        csv_files = BulkCreateUserCsvFile.objects.none()
        serializer = BulkCreateUserSerializer(csv_files, many=True)
        return Response(serializer.data)
