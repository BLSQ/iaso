from django.contrib.auth.models import User
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.db import IntegrityError, transaction
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework import serializers, status
from django.core import validators
import csv

from iaso.models import BulkCreateUserCsvFile, Profile, Account, OrgUnit


class BulkCreateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkCreateUserCsvFile
        fields = ["file", "created_by", "created_at"]


class BulkCreateUserFromCsvViewSet(ModelViewSet):
    """Api endpoint to bulkcreate users and profiles from a CSV File."""

    result_key = "file"
    remove_results_key_if_paginated = True

    def get_serializer_class(self):
        return BulkCreateUserSerializer

    def get_queryset(self):
        queryset = BulkCreateUserCsvFile.objects.all()

        return queryset

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        if request.FILES:
            user_csv = request.FILES["file"]
            file_instance = BulkCreateUserCsvFile.objects.create(
                file=user_csv,
                created_by=request.user,
            )
            file_instance.save()
            file = open(file_instance.file.path, "r")
            reader = csv.reader(file)
            i = 0
            csv_indexes = []
            org_units_list = []
            for row in reader:
                if i > 0:
                    try:
                        validators.validate_email(row[csv_indexes.index("email")])
                    except ValidationError:
                        return Response(
                            {
                                "Operation aborted. Invalid Email at row : {0}. Fix the error and try "
                                "again.".format(i)
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    try:
                        user = User.objects.create(
                            username=row[csv_indexes.index("username")],
                            first_name=row[csv_indexes.index("first_name")],
                            last_name=row[csv_indexes.index("last_name")],
                            email=row[csv_indexes.index("email")],
                            password=row[csv_indexes.index("password")],
                        )
                        user.save()
                    except IntegrityError:
                        return Response(
                            {
                                "error": "Operation aborted. Error at row {0} Account already exists : {1}. Fix the "
                                "error and try "
                                "again.".format(i, row[csv_indexes.index("username")])
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    org_units = row[csv_indexes.index("orgunit")]
                    if org_units:
                        if org_units.isdigit():
                            try:
                                org_units_list.append(OrgUnit.objects.get(id=org_units))
                            except ObjectDoesNotExist:
                                return Response(
                                    {
                                        "error": "Operation aborted. Invalid OrgUnit {0} at row : {1}. Fix the error "
                                        "and try "
                                        "again.".format(org_units, i)
                                    },
                                    status=status.HTTP_400_BAD_REQUEST,
                                )

                        if "," in org_units:
                            org_units = org_units.split(",")
                            for ou in org_units:
                                ou = ou[1::] if ou[:1] == " " else ou
                                try:
                                    if int(ou):
                                        try:
                                            ou = OrgUnit.objects.get(id=ou)
                                            org_units_list.append(ou)
                                        except ObjectDoesNotExist:
                                            return Response(
                                                {
                                                    "error": "Operation aborted. Invalid OrgUnit {0} at row : {1}. "
                                                    "Fix the error "
                                                    "and try "
                                                    "again.".format(ou, i)
                                                },
                                                status=status.HTTP_400_BAD_REQUEST,
                                            )
                                except ValueError:
                                    try:
                                        org_units_list.append(OrgUnit.objects.get(name=ou))
                                    except ObjectDoesNotExist:
                                        return Response(
                                            {
                                                "error": "Operation aborted. Invalid OrgUnit {0} at row : {1}. Fix "
                                                "the error "
                                                "and try "
                                                "again.".format(ou, i)
                                            },
                                            status=status.HTTP_400_BAD_REQUEST,
                                        )
                    profile = Profile.objects.create(account=request.user.iaso_profile.account, user=user)
                    if row[csv_indexes.index("profile_language")]:
                        language = row[csv_indexes.index("profile_language")].lower()
                        profile.language = language
                    profile.org_units.set(org_units_list)
                    profile.save()
                else:
                    csv_indexes = row
                i += 1
        csv_files = BulkCreateUserCsvFile.objects.all()
        serializer = BulkCreateUserSerializer(csv_files, many=True)
        return Response(serializer.data)
