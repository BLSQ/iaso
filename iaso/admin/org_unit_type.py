from django.contrib.gis import admin

from iaso.admin.utils import admin_attr_decorator
from iaso.models import OrgUnitType


@admin.register(OrgUnitType)
@admin_attr_decorator
class OrgUnitTypeAdmin(admin.GeoModelAdmin):
    search_fields = ("name",)
    list_display = ("name", "projects_list", "short_name", "depth")
    list_filter = ("projects",)

    @admin.display(description="Projects")
    @admin_attr_decorator
    def projects_list(self, obj):
        projects = obj.projects.all()
        return ", ".join(project.name for project in projects) if len(projects) > 0 else "-"
