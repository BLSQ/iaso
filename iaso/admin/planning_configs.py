from django.contrib import admin

from iaso.models import PlanningConfig


@admin.register(PlanningConfig)
class PlanningConfigAdmin(admin.ModelAdmin):
    list_display = ("planning", "level")
    list_filter = ["level"]
    search_fields = ("planning__name", "level")
    autocomplete_fields = ("org_unit_groups", "org_unit_types")
