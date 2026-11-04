from django.contrib import admin

from iaso.models.microplanning import PlanningSamplingResult


@admin.register(PlanningSamplingResult)
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
