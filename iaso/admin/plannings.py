from django.contrib import admin

from iaso.admin.base import admin_attr_decorator
from iaso.models import Planning, PlanningConfig


class PlanningConfigInline(admin.TabularInline):
    model = PlanningConfig
    extra = 1
    autocomplete_fields = ("org_unit_types", "org_unit_groups")


@admin.register(Planning)
@admin_attr_decorator
class PlanningAdmin(admin.ModelAdmin):
    raw_id_fields = ("org_unit",)
    autocomplete_fields = ("project", "team", "created_by", "org_unit", "target_org_unit_types")
    search_fields = ("name", "description")
    list_select_related = ("project", "org_unit", "team")
    list_display = (
        "id",
        "name",
        "description",
        "project",
        "org_unit",
        # "forms",
        "team",
        "read_only",
    )
    list_filter = ("project", "read_only")
    date_hierarchy = "started_at"

    fieldsets = [
        (
            None,
            {
                "fields": (
                    "name",
                    "description",
                    "read_only",
                    "project",
                    "missions",
                    "org_unit",
                    "team",
                    "started_at",
                    "ended_at",
                    "pipeline_uuids",
                    "selected_sampling_result",
                    "target_org_unit_types",
                ),
            },
        ),
        (
            "update info",
            {
                "fields": (
                    "created_at",
                    "created_by",
                    "updated_at",
                    "deleted_at",
                )
            },
        ),
    ]
    readonly_fields = ("updated_at", "created_at")
    inlines = [PlanningConfigInline]
