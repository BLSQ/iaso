from django.contrib import admin

from iaso.admin.base import admin_attr_decorator
from iaso.models import Mission


# class MissionFormInline(admin.TabularInline):
#     model = MissionForm
#     extra = 1
#     raw_id_fields = ("form",)


@admin.register(Mission)
@admin_attr_decorator
class MissionAdmin(admin.ModelAdmin):
    # list_display = ("id", "name", "mission_type", "account", "org_unit_type", "entity_type")
    list_filter = ("mission_type", "account")
    search_fields = ("name",)
    # raw_id_fields = ("org_unit_type", "entity_type", "created_by")
    readonly_fields = ("created_at", "updated_at")
    # inlines = [MissionFormInline]
