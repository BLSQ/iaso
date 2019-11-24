from django.contrib import admin

from .models import Case, Location, TestGroup


class CaseAdmin(admin.ModelAdmin):
    date_hierarchy = "document_date"
    list_filter = ("test_catt", "source", "confirmed_case")
    search_fields = ("name", "lastname", "prename")
    raw_id_fields = (
        "normalized_patient",
        "normalized_AS",
        "normalized_village",
        "infection_location",
    )


admin.site.register(Case, CaseAdmin)


class LocationAdmin(admin.ModelAdmin):
    search_fields = ("village",)


admin.site.register(Location, LocationAdmin)


class TestGroupAdmin(admin.ModelAdmin):
    date_hierarchy = "created_at"
    raw_id_fields = ("cases",)


admin.site.register(TestGroup, TestGroupAdmin)
