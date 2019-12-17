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
    Profile,
    ExternalCredentials,
    Mapping,
)


class OrgUnitAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("parent",)
    list_filter = ("org_unit_type", "custom", "validated", "sub_source", "version")
    search_fields = ("name", "source_ref", "uuid")
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
    search_fields = ("file_name", "uuid")


class InstanceFileAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("instance",)
    search_fields = ("name", "file")


class LinkAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("source", "destination")


admin.site.register(Link, LinkAdmin)

admin.site.register(Form, FormAdmin)
admin.site.register(Instance, InstanceAdmin)
admin.site.register(InstanceFile, InstanceFileAdmin)
admin.site.register(Account)
admin.site.register(Project)
admin.site.register(Device)
admin.site.register(SourceVersion)
admin.site.register(DataSource)
admin.site.register(DeviceOwnership)
admin.site.register(MatchingAlgorithm)
admin.site.register(AlgorithmRun)
admin.site.register(FormVersion)
admin.site.register(Profile)
admin.site.register(ExternalCredentials)
admin.site.register(Mapping)


class GroupAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("groups",)


admin.site.register(Group)
