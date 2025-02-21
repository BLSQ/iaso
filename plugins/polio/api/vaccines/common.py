import datetime
from django.utils import timezone
from hat.menupermissions import models as permission
from rest_framework import permissions

VACCINE_STOCK_MANAGEMENT_DAYS_OPEN = 7


def can_edit_helper(user, the_date, admin_perm, non_admin_perm, days_open=VACCINE_STOCK_MANAGEMENT_DAYS_OPEN):
    if the_date is None:
        return False

    if user.has_perm(admin_perm) or user.is_superuser:
        return True

    if user.has_perm(non_admin_perm):
        end_of_open_time = timezone.now() - datetime.timedelta(days=days_open)
        return the_date >= end_of_open_time

    return False


class VaccineStockManagementPermission(permissions.BasePermission):
    def __init__(
        self,
        admin_perm,
        non_admin_perm,
        days_open=VACCINE_STOCK_MANAGEMENT_DAYS_OPEN,
        datetime_field="created_at",
        datetime_now_today=timezone.now,
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        self.non_admin_perm = non_admin_perm
        self.admin_perm = admin_perm
        self.days_open = days_open
        self.datetime_field = datetime_field
        self.datetime_now_today = datetime_now_today

    def has_permission(self, request, view):
        # For read-only methods, allow access to anyone
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        # For write operations, require appropriate permissions
        if (
            request.user.has_perm(self.admin_perm)
            or request.user.has_perm(self.non_admin_perm)
            or request.user.is_superuser
        ):
            return True

        return False

    def has_object_permission(self, request, view, obj):
        # Users with write permission can do anything
        if request.user.has_perm(self.admin_perm) or request.user.is_superuser:
            return True

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
                "add_arrival_reports",
                "update_arrival_reports",
            ]:
                return True  # There are multiple objects in one request for those so this is checked in the serializer
            else:
                one_week_ago = self.datetime_now_today() - datetime.timedelta(days=self.days_open)
                return getattr(obj, self.datetime_field) >= one_week_ago

        return False
