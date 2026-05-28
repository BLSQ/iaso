from django.contrib.gis import admin

from iaso.admin.utils import admin_attr_decorator
from iaso.models import Group, GroupSet


@admin.register(Group)
@admin_attr_decorator
class GroupAdmin(admin.ModelAdmin):
    raw_id_fields = ("org_units",)
    search_fields = ("name", "source_version")
    list_display = ("name", "source_version", "created_at", "org_unit_count", "source_ref")

    def org_unit_count(self, obj):
        return obj.org_units.count()


@admin.register(GroupSet)
class GroupSetAdmin(admin.ModelAdmin):
    autocomplete_fields = ["source_version"]
