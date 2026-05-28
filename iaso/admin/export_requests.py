from django.contrib.gis import admin

from iaso.admin.utils import admin_attr_decorator
from iaso.models import ExportRequest


@admin.register(ExportRequest)
@admin_attr_decorator
class ExportRequestAdmin(admin.GeoModelAdmin):
    list_filter = ("launcher", "status")
    list_display = ("status", "launcher", "params", "last_error_message")
    readonly_fields = list_display
