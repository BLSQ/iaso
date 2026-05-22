from django.contrib.gis import admin

from .models import APIImport


@admin.register(APIImport)
class APIImportAdmin(admin.GeoModelAdmin):
    date_hierarchy = "created_at"
    search_fields = ("json_body", "headers", "exception")
    list_display = (
        "id",
        "created_at",
        "import_type",
        "has_problem",
        "user",
        "app_id",
    )
    list_filter = (
        "has_problem",
        "import_type",
        "app_id",
    )

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("user")
