from django.contrib import admin

from .models import OrgUnitType, OrgLevel, OrgUnit


class OrgUnitAdmin(admin.ModelAdmin):
    list_filter = ("org_level", "org_unit_type")
    search_fields = ("name", "source_ref")
    ordering = ("name",)


admin.site.register(OrgUnit, OrgUnitAdmin)


class OrgLevelAdmin(admin.ModelAdmin):
    list_filter = ("level",)
    search_fields = ("name",)
    ordering = ("name",)


admin.site.register(OrgLevel, OrgLevelAdmin)


class OrgUnitTypeAdmin(admin.ModelAdmin):
    search_fields = ("name",)
    ordering = ("name",)


admin.site.register(OrgUnitType, OrgUnitTypeAdmin)
