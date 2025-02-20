import datetime
from django.utils import timezone
from hat.menupermissions import models as permission
from rest_framework import permissions

VACCINE_STOCK_MANAGEMENT_DAYS_OPEN = 7


def can_edit_helper(user, the_date, now_today):
    if the_date is None:
        return False

    if user.has_perm(permission.POLIO_VACCINE_STOCK_MANAGEMENT_WRITE) or user.is_superuser:
        return True

    if user.has_perm(permission.POLIO_VACCINE_STOCK_MANAGEMENT_READ):
        end_of_open_time = now_today - datetime.timedelta(days=VACCINE_STOCK_MANAGEMENT_DAYS_OPEN)
        return the_date >= end_of_open_time

    return False


def can_edit_helper_date(user, the_date):
    return can_edit_helper(user, the_date, datetime.date.today())


def can_edit_helper_datetime(user, the_datetime):
    return can_edit_helper(user, the_datetime, timezone.now())


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
        # Users with read or write permission can do anything in general
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

        # Users with read permission can read anything or add entries
        if request.user.has_perm(self.non_admin_perm):
            if request.method in ["GET", "HEAD", "OPTIONS", "POST"]:
                return True

            # For edit/delete, check if object is less than a week old
            if request.method in ["PUT", "PATCH", "DELETE"]:
                one_week_ago = self.datetime_now_today() - datetime.timedelta(days=self.days_open)
                return getattr(obj, self.datetime_field) >= one_week_ago

        return False
