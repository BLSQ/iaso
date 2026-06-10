from django.contrib.gis import admin

from iaso.admin.utils import admin_attr_decorator
from iaso.models import Team


@admin.register(Team)
@admin_attr_decorator
class TeamAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "description",
        "project",
        "type",
        "updated_at",
        "parent",
    )
    list_filter = ("project", "type")
    date_hierarchy = "created_at"
    readonly_fields = ("path",)
