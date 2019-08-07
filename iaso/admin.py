from django.contrib import admin

from .models import (
    OrgUnitType,
    OrgUnit,
    Form,
    Instance,
    InstanceFile,
    Account,
    Project,
    Device,
    DeviceOwnership,
)


class OrgUnitAdmin(admin.ModelAdmin):
    raw_id_fields = ("parent",)
    list_filter = ("org_unit_type", "custom", "validated")
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


class InstanceAdmin(admin.ModelAdmin):
    raw_id_fields = ("org_unit",)


admin.site.register(Form, FormAdmin)
admin.site.register(Instance, InstanceAdmin)
admin.site.register(InstanceFile)
admin.site.register(Account)
admin.site.register(Project)
admin.site.register(Device)
admin.site.register(DeviceOwnership)
