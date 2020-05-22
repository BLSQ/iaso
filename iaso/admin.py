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
    FeatureFlag,
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
    MappingVersion,
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
    list_display = (
        "name",
        "form_id",
        "period_type",
        "single_per_period",
        "periods_before_allowed",
        "periods_after_allowed",
        "derived",
    )


class InstanceAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("org_unit",)
    search_fields = ("file_name", "uuid")


class InstanceFileAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("instance",)
    search_fields = ("name", "file")


class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "app_id",
        "account",
        "needs_authentication",
        "feature_flags_list",
    )

    def feature_flags_list(self, obj):
        flags = obj.feature_flags.all()
        return ", ".join(flag.name for flag in flags) if len(flags) > 0 else "-"

    feature_flags_list.short_description = "Feature flags"


class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ("code", "name")


class LinkAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("source", "destination")


class MappingAdmin(admin.GeoModelAdmin):
    list_filter = ("form_id",)


class MappingVersionAdmin(admin.GeoModelAdmin):
    list_filter = ("form_version_id",)


class GroupAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("org_units",)


class ProfileAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("org_units",)


admin.site.register(Link, LinkAdmin)
admin.site.register(Form, FormAdmin)
admin.site.register(Instance, InstanceAdmin)
admin.site.register(InstanceFile, InstanceFileAdmin)
admin.site.register(Account)
admin.site.register(Project, ProjectAdmin)
admin.site.register(FeatureFlag, FeatureFlagAdmin)
admin.site.register(Device)
admin.site.register(SourceVersion)
admin.site.register(DataSource)
admin.site.register(DeviceOwnership)
admin.site.register(MatchingAlgorithm)
admin.site.register(AlgorithmRun)
admin.site.register(FormVersion)
admin.site.register(Profile, ProfileAdmin)
admin.site.register(ExternalCredentials)
admin.site.register(Mapping, MappingAdmin)
admin.site.register(MappingVersion, MappingVersionAdmin)
admin.site.register(Group, GroupAdmin)
