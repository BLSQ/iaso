from django.db import transaction
from rest_framework import serializers, permissions
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from iaso.api.tasks import TaskSerializer
from iaso.models import BulkCreateUserCsvFile
from iaso.tasks.bulk_create_users import bulk_create_users_task


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
    permission_classes = [HasUserPermission, permissions.IsAuthenticated]

    def get_serializer_class(self):
        return BulkCreateUserSerializer

    def get_queryset(self):
        queryset = BulkCreateUserCsvFile.objects.none()

        return queryset

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        user = request.user
        file = request.FILES["file"]
        file_instance = BulkCreateUserCsvFile.objects.create(
            file=file, created_by=user, account=user.iaso_profile.account
        )
        task = bulk_create_users_task(user.id, file_id=file_instance.id, launch_task=True, user=user)  # type: ignore

        return Response({"task": TaskSerializer(instance=task).data})
