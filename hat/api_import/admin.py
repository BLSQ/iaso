from django.contrib.gis import admin

from .models import APIImport


class APIImportAdmin(admin.GeoModelAdmin):
    date_hierarchy = "created_at"
    search_fields = ("json_body", "headers", "exception")
    list_filter = ("has_problem", "import_type")


admin.site.register(APIImport, APIImportAdmin)
