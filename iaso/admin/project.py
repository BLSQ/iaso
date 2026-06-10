from django.contrib import admin

from iaso.admin.utils import admin_attr_decorator
from iaso.models import Project


@admin.register(Project)
@admin_attr_decorator
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "app_id", "account", "needs_authentication", "feature_flags_list")
    autocomplete_fields = ["account"]
    search_fields = ["name"]

    @admin.display(description="Feature flags")
    @admin_attr_decorator
    def feature_flags_list(self, obj):
        flags = obj.feature_flags.all()
        return ", ".join(flag.name for flag in flags) if len(flags) > 0 else "-"
