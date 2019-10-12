from django.contrib.gis import admin

from .models import (
    OrgUnitType,
    OrgUnit,
    Form,
    FormVersion,
    Instance,
    InstanceFile,
    Account,
    Project,
    Device,
    DeviceOwnership,
    DataSource,
    SourceVersion,
    MatchingAlgorithm,
    AlgorithmRun,
    Link,
    Group,
)


class OrgUnitAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("parent",)
    list_filter = ("org_unit_type", "custom", "validated", "sub_source")
    search_fields = ("name", "source_ref")
    ordering = ("name",)


admin.site.register(OrgUnit, OrgUnitAdmin)


class OrgUnitTypeAdmin(admin.GeoModelAdmin):
    search_fields = ("name",)
    ordering = ("name",)


admin.site.register(OrgUnitType, OrgUnitTypeAdmin)


class FormAdmin(admin.GeoModelAdmin):
    search_fields = ("name", "form_id")
    ordering = ("name",)


class InstanceAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("org_unit",)


admin.site.register(Form, FormAdmin)
admin.site.register(Instance, InstanceAdmin)
admin.site.register(InstanceFile)
admin.site.register(Account)
admin.site.register(Project)
admin.site.register(Device)
admin.site.register(SourceVersion)
admin.site.register(DataSource)
admin.site.register(DeviceOwnership)
admin.site.register(MatchingAlgorithm)
admin.site.register(AlgorithmRun)
admin.site.register(Link)
admin.site.register(FormVersion)


class GroupAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("groups",)


admin.site.register(Group)
