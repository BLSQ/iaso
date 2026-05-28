from django.contrib.gis import admin
from django.utils.html import format_html_join
from django.utils.safestring import mark_safe

from iaso.admin.utils import admin_attr_decorator
from iaso.models import ExportStatus


@admin.register(ExportStatus)
@admin_attr_decorator
class ExportStatusAdmin(admin.GeoModelAdmin):
    list_display = ("id", "status", "last_error_message")
    readonly_fields = (
        "id",
        "status",
        "last_error_message",
        "export_request",
        "instance",
        "mapping_version",
        "http_requests",
    )
    list_filter = ("status",)
    exclude = ("export_logs",)

    def http_requests(self, instance):
        # Write a get-method for a list of module names in the class Profile
        # return HTML string which will be display in the form
        return format_html_join(
            mark_safe("<br/><br/>"),
            "{} http status: {} url : {} <br/> <ul> <li>sent <pre>{}</pre> </li><li>received <pre>{}</pre></li></ul>",
            ((line.id, line.http_status, line.url, line.sent, line.received) for line in instance.export_logs.all()),
        ) or mark_safe("<span>no logs available.</span>")
