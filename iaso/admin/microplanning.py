from django.contrib.gis import admin

from iaso.admin.utils import admin_attr_decorator
from iaso.models.microplanning import Assignment, Planning, PlanningSamplingResult


@admin.register(Assignment)
@admin_attr_decorator
class AssignmentAdmin(admin.ModelAdmin):
    raw_id_fields = ("org_unit",)
    list_display = (
        "id",
        "planning",
    )
    list_filter = ("planning",)
    date_hierarchy = "created_at"


@admin.register(PlanningSamplingResult)
@admin_attr_decorator
class PlanningSamplingResultAdmin(admin.ModelAdmin):
    raw_id_fields = ("planning", "group", "task", "created_by")
    readonly_fields = ("created_at", "parameters")
    list_display = (
        "id",
        "planning",
        "pipeline_id",
        "pipeline_version",
        "group",
        "task",
        "created_at",
    )
    list_filter = ("planning",)
    search_fields = ("pipeline_id", "pipeline_version")
    date_hierarchy = "created_at"


@admin.register(Planning)
@admin_attr_decorator
class PlanningAdmin(admin.ModelAdmin):
    raw_id_fields = ("org_unit",)
    list_display = (
        "id",
        "name",
        "description",
        "project",
        "org_unit",
        # "forms",
        "team",
    )
    list_filter = ("project",)
    date_hierarchy = "started_at"

    fieldsets = [
        (
            None,
            {
                "fields": (
                    "name",
                    "description",
                    "project",
                    "forms",
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
