from django.contrib import admin

from iaso.admin.base import admin_attr_decorator
from iaso.models import Assignment


@admin.register(Assignment)
@admin_attr_decorator
class AssignmentAdmin(admin.ModelAdmin):
    raw_id_fields = ("org_unit",)
    autocomplete_fields = ("planning", "team", "user", "created_by")
    search_fields = ("planning__name", "user__username")
    list_select_related = ("planning", "user")
    list_display = (
        "id",
        "planning",
    )
    date_hierarchy = "created_at"
