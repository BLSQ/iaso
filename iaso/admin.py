from django.contrib import admin

from .models import OrgUnitType, OrgUnit, Form


class OrgUnitAdmin(admin.ModelAdmin):
    list_filter = ("org_unit_type",)
    search_fields = ("name", "source_ref")
    ordering = ("name",)


admin.site.register(OrgUnit, OrgUnitAdmin)


class OrgUnitTypeAdmin(admin.ModelAdmin):
    search_fields = ("name",)
    ordering = ("name",)


admin.site.register(OrgUnitType, OrgUnitTypeAdmin)


class FormAdmin(admin.ModelAdmin):
    search_fields = ("name", "form_id")
    ordering = ("name",)


admin.site.register(Form, FormAdmin)
