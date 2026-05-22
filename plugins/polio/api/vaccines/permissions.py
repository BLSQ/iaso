import datetime

from django.utils import timezone
from rest_framework import permissions

from plugins.polio.models import OutgoingStockMovement, VaccineStock
from plugins.polio.permissions import PolioPermission


TEMPORARY_FORM_A_COMPLETION_FIELDS = {"status", "form_a_reception_date", "file", "comment"}


def is_within_management_edit_window(the_date, days_open=VaccineStock.MANAGEMENT_DAYS_OPEN, now=None):
    if the_date is None:
        return False
    if now is None:
        now = timezone.now()
    return the_date >= now - datetime.timedelta(days=days_open)


def has_vaccine_stock_edit_access(
    user,
    the_date,
    admin_perm: PolioPermission,
    non_admin_perm: PolioPermission,
    read_only_perm: PolioPermission,
    days_open=VaccineStock.MANAGEMENT_DAYS_OPEN,
):
    if user.has_perm(admin_perm.full_name()):
        return True

    if user.has_perm(non_admin_perm.full_name()):
        return is_within_management_edit_window(the_date, days_open=days_open)

    if user.has_perm(read_only_perm.full_name()):
        return False

    return False


class VaccineStockPermission(permissions.BasePermission):
    def __init__(
        self,
        admin_perm: PolioPermission,
        non_admin_perm: PolioPermission,
        read_only_perm: PolioPermission,
        days_open=VaccineStock.MANAGEMENT_DAYS_OPEN,
        datetime_field="created_at",
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        self.non_admin_perm = non_admin_perm
        self.admin_perm = admin_perm
        self.read_only_perm = read_only_perm
        self.days_open = days_open
        self.datetime_field = datetime_field

    def has_permission(self, request, view):
        # For read operations, allow access to anyone with any of the permissions
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return (
                request.user.has_perm(self.admin_perm.full_name())
                or request.user.has_perm(self.non_admin_perm.full_name())
                or request.user.has_perm(self.read_only_perm.full_name())
            )

        # For write operations, require appropriate permissions
        if request.user.has_perm(self.admin_perm.full_name()) or request.user.has_perm(self.non_admin_perm.full_name()):
            return True

        return False

    def has_object_permission(self, request, view, obj):
        # Users with write permission can do anything
        if request.user.has_perm(self.admin_perm.full_name()):
            return True

        # Users with read-only permission can only read
        if request.user.has_perm(self.read_only_perm.full_name()):
            return request.method in ["GET", "HEAD", "OPTIONS"]

        if request.user.has_perm(self.non_admin_perm.full_name()):
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
                if is_within_management_edit_window(
                    getattr(obj, self.datetime_field),
                    days_open=self.days_open,
                ):
                    return True
                return self._allow_after_window_edit(request, view, obj)

        return False

    def _allow_after_window_edit(self, request, view, obj):
        return False


class OutgoingStockMovementPermission(VaccineStockPermission):
    def _is_temporary_form_a_completion_edit(self, request, obj):
        if request.method not in ["PUT", "PATCH"]:
            return False

        if getattr(obj, "status", None) != OutgoingStockMovement.StatusChoices.TEMPORARY:
            return False

        requested_fields = set(getattr(request, "data", {}).keys())
        return requested_fields.issubset(TEMPORARY_FORM_A_COMPLETION_FIELDS)

    def _allow_after_window_edit(self, request, view, obj):
        return self._is_temporary_form_a_completion_edit(request, obj)


class VaccineStockEarmarkPermission(permissions.BasePermission):
    def __init__(
        self,
        admin_perm: PolioPermission,
        non_admin_perm: PolioPermission,
        read_only_perm: PolioPermission,
        days_open=VaccineStock.MANAGEMENT_DAYS_OPEN,
        datetime_field="created_at",
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        self.non_admin_perm = non_admin_perm
        self.admin_perm = admin_perm
        self.read_only_perm = read_only_perm
        self.days_open = days_open
        self.datetime_field = datetime_field

    def has_permission(self, request, view):
        # For read operations, allow access to anyone with any of the permissions
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return (
                request.user.has_perm(self.admin_perm.full_name())
                or request.user.has_perm(self.non_admin_perm.full_name())
                or request.user.has_perm(self.read_only_perm.full_name())
            )

        # For write operations, require appropriate permissions
        if request.user.has_perm(self.admin_perm.full_name()) or request.user.has_perm(self.non_admin_perm.full_name()):
            return True

        return False

    def has_object_permission(self, request, view, obj):
        # Users with write permission can do anything
        if request.user.has_perm(self.admin_perm.full_name()):
            return True

        # Users with read-only permission can only read
        if request.user.has_perm(self.read_only_perm.full_name()):
            return request.method in ["GET", "HEAD", "OPTIONS"]

        # Users without any permission can read anything
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        # Users with non-admin permission can add entries
        if request.method in ["POST"] and request.user.has_perm(self.non_admin_perm.full_name()):
            return True

        # For edit/delete, check if object is less than a week old and the use has at least the non-admin permission
        if request.method in ["PUT", "PATCH", "DELETE"] and request.user.has_perm(self.non_admin_perm.full_name()):
            if view.action in [
                "add_pre_alerts",
                "update_pre_alerts",
                "delete_pre_alerts",
                "add_arrival_reports",
                "update_arrival_reports",
                "delete_arrival_reports",
            ]:
                return True  # There are multiple objects in one request for those so this is checked in the serializer
            return is_within_management_edit_window(
                getattr(obj, self.datetime_field),
                days_open=self.days_open,
            )

        return False
