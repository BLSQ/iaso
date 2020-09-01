from django.contrib.gis import admin

from .models import APIImport


class APIImportAdmin(admin.GeoModelAdmin):
    date_hierarchy = "created_at"
    search_fields = ("json",)
    list_filter = ("has_problem",)


admin.site.register(APIImport, APIImportAdmin)
