import json

from django.contrib.auth.models import User
from django.contrib.gis import admin
from django.utils.html import format_html_join, format_html
from django.utils.safestring import mark_safe

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
    GroupSet,
    Profile,
    ExternalCredentials,
    Mapping,
    MappingVersion,
    ExportRequest,
    ExportStatus,
    ExportLog,
    DevicePosition,
    Task,
    Page,
    AccountFeatureFlag,
)


class OrgUnitAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("parent",)
    list_filter = ("org_unit_type", "custom", "validated", "sub_source", "version")
    search_fields = ("name", "source_ref", "uuid")
    readonly_fields = ("path",)


admin.site.register(OrgUnit, OrgUnitAdmin)


class OrgUnitTypeAdmin(admin.GeoModelAdmin):
    search_fields = ("name",)
    list_display = ("name", "projects_list", "short_name", "depth")
    list_filter = ("projects",)

    def projects_list(self, obj):
        projects = obj.projects.all()
        return ", ".join(project.name for project in projects) if len(projects) > 0 else "-"

    projects_list.short_description = "Projects"


admin.site.register(OrgUnitType, OrgUnitTypeAdmin)


class FormAdmin(admin.GeoModelAdmin):
    search_fields = ("name", "form_id")
    list_display = (
        "name",
        "form_id",
        "period_type",
        "single_per_period",
        "periods_before_allowed",
        "periods_after_allowed",
        "derived",
        "created_at",
        "updated_at",
        "deleted_at",
    )

    def get_queryset(self, request):
        return Form.objects_include_deleted.all()


class FormVersionAdmin(admin.GeoModelAdmin):
    search_fields = ("form__name", "form__form_id")
    ordering = ("form__name",)
    list_display = ("form_name", "form_id", "version_id", "created_at", "updated_at")

    def form_name(self, obj):
        return obj.form.name

    def form_id(self, obj):
        return obj.form.form_id

    form_name.short_description = "Form name"
    form_name.admin_order_field = "form__name"

    form_id.short_description = "Form ID"
    form_id.admin_order_field = "form__id"


class InstanceAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("org_unit",)
    search_fields = ("file_name", "uuid")
    list_display = ("project", "form", "org_unit", "period", "created_at")


class InstanceFileAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("instance",)
    search_fields = ("name", "file")


class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "app_id", "account", "needs_authentication", "feature_flags_list")

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
    search_fields = ("name",)


class UserAdmin(admin.GeoModelAdmin):
    search_fields = ("username", "email", "first_name", "last_name", "iaso_profile__account__name")
    list_filter = ("iaso_profile__account", "is_staff", "is_superuser", "is_active")
    list_display = ("username", "email", "first_name", "last_name", "iaso_profile", "is_superuser")


class ProfileAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("org_units",)
    search_fields = ("user__username", "user__first_name", "user__last_name", "account__name")
    list_select_related = ("user", "account")
    list_filter = ("account",)
    list_display = ("id", "user", "account", "language")


class ExportRequestAdmin(admin.GeoModelAdmin):
    list_filter = ("launcher", "status")
    list_display = ("status", "launcher", "params", "last_error_message")
    readonly_fields = list_display


class ExportLogAdmin(admin.GeoModelAdmin):
    list_display = ("id", "http_status", "url", "sent", "received")
    readonly_fields = list_display


class ExportStatusAdmin(admin.GeoModelAdmin):
    list_display = ("id", "status", "last_error_message")
    readonly_fields = (
        "id",
        "status",
        "last_error_message",
        "export_request",
        "instance",
        "mapping_version",
        "http_requests",
    )
    list_filter = ("status",)
    exclude = ("export_logs",)

    def http_requests(self, instance):
        # Write a get-method for a list of module names in the class Profile
        # return HTML string which will be display in the form
        return (
            format_html_join(
                mark_safe("<br/><br/>"),
                "{} http status: {} url : {} <br/> <ul> <li>sent <pre>{}</pre> </li><li>received <pre>{}</pre></li></ul>",
                (
                    (line.id, line.http_status, line.url, line.sent, line.received)
                    for line in instance.export_logs.all()
                ),
            )
            or mark_safe("<span>no logs available.</span>")
        )


class TaskAdmin(admin.ModelAdmin):
    list_display = ("name", "account", "status", "created_at", "launcher", "result_message")
    list_filter = ("account", "status", "name")
    readonly_fields = ("stacktrace", "created_at", "result")

    def result_message(self, task):
        return task.result and task.result.get("message", "")

    def stacktrace(self, task):
        if not task.result:
            return
        stack = task.result.get("stack_trace")
        return format_html("<p>{}</p><pre>{}</pre>", task.result.get("message", ""), stack)


class SourceVersionAdmin(admin.ModelAdmin):
    readonly_fields = ("created_at",)
    list_display = ("id", "data_source", "number", "created_at")
    list_filter = ("data_source",)


admin.site.register(Link, LinkAdmin)
admin.site.register(Form, FormAdmin)
admin.site.register(Instance, InstanceAdmin)
admin.site.register(InstanceFile, InstanceFileAdmin)
admin.site.register(Account)
admin.site.register(AccountFeatureFlag)
admin.site.register(Project, ProjectAdmin)
admin.site.register(FeatureFlag, FeatureFlagAdmin)
admin.site.register(Device)
admin.site.register(SourceVersion, SourceVersionAdmin)
admin.site.register(DataSource)
admin.site.register(DeviceOwnership)
admin.site.register(MatchingAlgorithm)
admin.site.register(AlgorithmRun)
admin.site.register(FormVersion, FormVersionAdmin)
admin.site.register(Profile, ProfileAdmin)
admin.site.register(ExternalCredentials)
admin.site.register(Mapping, MappingAdmin)
admin.site.register(MappingVersion, MappingVersionAdmin)
admin.site.register(Group, GroupAdmin)
admin.site.register(GroupSet)
admin.site.register(ExportRequest, ExportRequestAdmin)
admin.site.register(ExportStatus, ExportStatusAdmin)
admin.site.register(ExportLog, ExportLogAdmin)
admin.site.register(DevicePosition)
admin.site.register(Page)
admin.site.register(Task, TaskAdmin)
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
