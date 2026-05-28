from django.contrib.gis import admin

from iaso.admin.utils import admin_attr_decorator
from iaso.models import ExportLog


@admin.register(ExportLog)
@admin_attr_decorator
class ExportLogAdmin(admin.GeoModelAdmin):
    list_display = ("id", "http_status", "url", "sent", "received")
    readonly_fields = list_display
