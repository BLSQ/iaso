import datetime

from django.utils import timezone
from rest_framework import permissions

from plugins.polio.models import VaccineStock


def can_edit_helper(
    user,
    the_date,
    admin_perm,
    non_admin_perm,
    read_only_perm,
    days_open=VaccineStock.MANAGEMENT_DAYS_OPEN,
):
    if the_date is None:
        return False

    if user.has_perm(admin_perm):
        return True

    if user.has_perm(non_admin_perm):
        end_of_open_time = timezone.now() - datetime.timedelta(days=days_open)
        return the_date >= end_of_open_time

    if user.has_perm(read_only_perm):
        return False

    return False


class VaccineStockPermission(permissions.BasePermission):
    def __init__(
        self,
        admin_perm,
        non_admin_perm,
        read_only_perm,
        days_open=VaccineStock.MANAGEMENT_DAYS_OPEN,
        datetime_field="created_at",
        datetime_now_today=timezone.now,
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        self.non_admin_perm = non_admin_perm
        self.admin_perm = admin_perm
        self.read_only_perm = read_only_perm
        self.days_open = days_open
        self.datetime_field = datetime_field
        self.datetime_now_today = datetime_now_today

    def has_permission(self, request, view):
        # For read operations, allow access to anyone with any of the permissions
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return (
                request.user.has_perm(self.admin_perm)
                or request.user.has_perm(self.non_admin_perm)
                or request.user.has_perm(self.read_only_perm)
            )

        # For write operations, require appropriate permissions
        if request.user.has_perm(self.admin_perm) or request.user.has_perm(self.non_admin_perm):
            return True

        return False

    def has_object_permission(self, request, view, obj):
        # Users with write permission can do anything
        if request.user.has_perm(self.admin_perm):
            return True

        # Users with read-only permission can only read
        if request.user.has_perm(self.read_only_perm):
            return request.method in ["GET", "HEAD", "OPTIONS"]

        if request.user.has_perm(self.non_admin_perm):
            # Users with non-admin permission can add entries
            if request.method in ["GET", "HEAD", "OPTIONS", "POST"]:
                return True

            # For edit/delete, check if object is less than a week old and the use has at least the non-admin permission
            if request.method in ["PUT", "PATCH", "DELETE"]:
                if view.action in [
                    "add_pre_alerts",
                    "update_pre_alerts",
                    "add_arrival_reports",
                    "update_arrival_reports",
                ]:
                    return (
                        True  # There are multiple objects in one request for those so this is checked in the serializer
                    )
                one_week_ago = self.datetime_now_today() - datetime.timedelta(days=self.days_open)
                return getattr(obj, self.datetime_field) >= one_week_ago

        return False


class VaccineStockEarmarkPermission(permissions.BasePermission):
    def __init__(
        self,
        admin_perm,
        non_admin_perm,
        read_only_perm,
        days_open=VaccineStock.MANAGEMENT_DAYS_OPEN,
        datetime_field="created_at",
        datetime_now_today=timezone.now,
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        self.non_admin_perm = non_admin_perm
        self.admin_perm = admin_perm
        self.read_only_perm = read_only_perm
        self.days_open = days_open
        self.datetime_field = datetime_field
        self.datetime_now_today = datetime_now_today

    def has_permission(self, request, view):
        # For read operations, allow access to anyone with any of the permissions
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return (
                request.user.has_perm(self.admin_perm)
                or request.user.has_perm(self.non_admin_perm)
                or request.user.has_perm(self.read_only_perm)
            )

        # For write operations, require appropriate permissions
        if request.user.has_perm(self.admin_perm) or request.user.has_perm(self.non_admin_perm):
            return True

        return False

    def has_object_permission(self, request, view, obj):
        # Users with write permission can do anything
        if request.user.has_perm(self.admin_perm):
            return True

        # Users with read-only permission can only read
        if request.user.has_perm(self.read_only_perm):
            return request.method in ["GET", "HEAD", "OPTIONS"]

        # Users without any permission can read anything
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        # Users with non-admin permission can add entries
        if request.method in ["POST"] and request.user.has_perm(self.non_admin_perm):
            return True

        # For edit/delete, check if object is less than a week old and the use has at least the non-admin permission
        if request.method in ["PUT", "PATCH", "DELETE"] and request.user.has_perm(self.non_admin_perm):
            if view.action in [
                "add_pre_alerts",
                "update_pre_alerts",
                "delete_pre_alerts",
                "add_arrival_reports",
                "update_arrival_reports",
                "delete_arrival_reports",
            ]:
                return True  # There are multiple objects in one request for those so this is checked in the serializer
            one_week_ago = self.datetime_now_today() - datetime.timedelta(days=self.days_open)
            return getattr(obj, self.datetime_field) >= one_week_ago

        return False
