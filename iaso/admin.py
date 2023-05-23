from typing import Any
from typing import Protocol

from django.contrib.admin import widgets
from django.contrib.gis import admin, forms
from django.contrib.gis.db import models as geomodels
from django.db import models
from django.utils.html import format_html_join, format_html
from django.utils.safestring import mark_safe
from django_json_widget.widgets import JSONEditorWidget  # type: ignore


class IasoJSONEditorWidget(JSONEditorWidget):
    class Media:
        css = {"all": ("css/admin-json-widget.css",)}

    def __init__(self, attrs=None, mode="code", options=None, width=None, height=None):
        if height == None:
            height = "400px"

        default_options = {
            "modes": ["text", "code"],
            "mode": mode,
            "search": True,
        }

        if options:
            default_options.update(options)

        super(IasoJSONEditorWidget, self).__init__(
            attrs=attrs, mode=mode, options=default_options, width=width, height=height
        )


from .models import (
    OrgUnitType,
    OrgUnit,
    Form,
    FormVersion,
    FormPredefinedFilter,
    FormAttachment,
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
    EntityType,
    Entity,
    BulkCreateUserCsvFile,
    InstanceLock,
    StorageDevice,
    StoragePassword,
    StorageLogEntry,
    Workflow,
    WorkflowVersion,
    WorkflowChange,
    WorkflowFollowup,
    Report,
    ReportVersion,
)
from .models.microplanning import Team, Planning, Assignment
from .models.data_store import JsonDataStore
from .utils.gis import convert_2d_point_to_3d


class AdminAttributes(Protocol):
    """Workaround to avoid mypy errors, see https://github.com/python/mypy/issues/2087#issuecomment-462726600"""

    short_description: str
    admin_order_field: str


def admin_attr_decorator(func: Any) -> AdminAttributes:
    return func


@admin_attr_decorator
class OrgUnitAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("parent", "reference_instance")
    list_filter = ("org_unit_type", "custom", "validated", "sub_source", "version")
    search_fields = ("name", "source_ref", "uuid")
    readonly_fields = ("path",)


admin.site.register(OrgUnit, OrgUnitAdmin)


@admin_attr_decorator
class OrgUnitTypeAdmin(admin.GeoModelAdmin):
    search_fields = ("name",)
    list_display = ("name", "projects_list", "short_name", "depth")
    list_filter = ("projects",)

    @admin_attr_decorator
    def projects_list(self, obj):
        projects = obj.projects.all()
        return ", ".join(project.name for project in projects) if len(projects) > 0 else "-"

    projects_list.short_description = "Projects"


admin.site.register(OrgUnitType, OrgUnitTypeAdmin)


@admin_attr_decorator
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

    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}

    def get_queryset(self, request):
        return Form.objects_include_deleted.all()


@admin_attr_decorator
class FormVersionAdmin(admin.GeoModelAdmin):
    search_fields = ("form__name", "form__form_id")
    ordering = ("form__name",)
    list_display = ("form_name", "form_id", "version_id", "created_at", "updated_at")

    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}

    @admin_attr_decorator
    def form_name(self, obj):
        return obj.form.name

    @admin_attr_decorator
    def form_id(self, obj):
        return obj.form.form_id

    form_name.short_description = "Form name"
    form_name.admin_order_field = "form__name"

    form_id.short_description = "Form ID"
    form_id.admin_order_field = "form__id"


class FormPredefinedFilterAdmin(admin.ModelAdmin):
    readonly_fields = ("created_at", "updated_at")
    list_display = ("form", "name", "short_name", "json_logic")
    list_filter = ("form", "name", "short_name")


class FormAttachmentAdmin(admin.ModelAdmin):
    readonly_fields = ("created_at", "updated_at")
    list_display = ("form", "name", "file", "md5")
    list_filter = ("form", "name")


class InstanceFileAdminInline(admin.TabularInline):
    model = InstanceFile
    extra = 0
    formfield_overrides = {
        models.TextField: {"widget": widgets.AdminTextInputWidget},
        models.JSONField: {"widget": IasoJSONEditorWidget},
    }


@admin_attr_decorator
class InstanceAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("org_unit",)
    search_fields = ("file_name", "uuid")
    list_display = ("id", "project", "form", "org_unit", "period", "created_at", "deleted")
    list_filter = ("project", "form", "deleted")
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "deleted",
                    "form",
                    "period",
                    "uuid",
                    "name",
                    "org_unit",
                    "device",
                    "entity",
                    "last_modified_by",
                    "created_by",
                    "form_version",
                    "planning",
                )
            },
        ),
        (
            "File",
            {
                "fields": (
                    "file",
                    "file_name",
                    "correlation_id",
                    "json",
                )
            },
        ),
        ("Export", {"fields": ("to_export", "export_id", "last_export_success_at")}),
        ("Other", {"fields": ("project", "location", "accuracy")}),
    )

    formfield_overrides = {
        models.TextField: {"widget": widgets.AdminTextInputWidget},
        geomodels.PointField: {"widget": forms.OSMWidget},  # type: ignore
        models.JSONField: {"widget": IasoJSONEditorWidget},
    }
    inlines = [
        InstanceFileAdminInline,
    ]

    def save_model(self, request, obj, form, change):
        if obj.location:  # GeoDjango's map return a 2D point, but the database expect a Z value
            obj.location = convert_2d_point_to_3d(obj.location)

        super().save_model(request, obj, form, change)


@admin_attr_decorator
class InstanceFileAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("instance",)
    search_fields = ("name", "file")


@admin_attr_decorator
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "app_id", "account", "needs_authentication", "feature_flags_list")

    @admin_attr_decorator
    def feature_flags_list(self, obj):
        flags = obj.feature_flags.all()
        return ", ".join(flag.name for flag in flags) if len(flags) > 0 else "-"

    feature_flags_list.short_description = "Feature flags"


@admin_attr_decorator
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ("code", "name")


@admin_attr_decorator
class LinkAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("source", "destination")


@admin_attr_decorator
class MappingAdmin(admin.GeoModelAdmin):
    list_filter = ("form_id",)


@admin_attr_decorator
class MappingVersionAdmin(admin.GeoModelAdmin):
    list_filter = ("form_version_id",)
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}


@admin_attr_decorator
class GroupAdmin(admin.ModelAdmin):
    raw_id_fields = ("org_units",)
    search_fields = ("name", "source_version", "domain")
    list_display = ("name", "source_version", "created_at", "org_unit_count", "domain", "source_ref")

    def org_unit_count(self, obj):
        return obj.org_units.count()


@admin_attr_decorator
class UserAdmin(admin.GeoModelAdmin):
    search_fields = ("username", "email", "first_name", "last_name", "iaso_profile__account__name")
    list_filter = ("iaso_profile__account", "is_staff", "is_superuser", "is_active")
    list_display = ("username", "email", "first_name", "last_name", "iaso_profile", "is_superuser")


@admin_attr_decorator
class ProfileAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("org_units",)
    search_fields = ("user__username", "user__first_name", "user__last_name", "account__name")
    list_select_related = ("user", "account")
    list_filter = ("account",)
    list_display = ("id", "user", "account", "language")


@admin_attr_decorator
class ExportRequestAdmin(admin.GeoModelAdmin):
    list_filter = ("launcher", "status")
    list_display = ("status", "launcher", "params", "last_error_message")
    readonly_fields = list_display


@admin_attr_decorator
class ExportLogAdmin(admin.GeoModelAdmin):
    list_display = ("id", "http_status", "url", "sent", "received")
    readonly_fields = list_display


@admin_attr_decorator
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


@admin_attr_decorator
class TaskAdmin(admin.ModelAdmin):
    list_display = ("name", "account", "status", "created_at", "launcher", "result_message")
    list_filter = ("account", "status", "name")
    readonly_fields = ("stacktrace", "created_at", "result")
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}

    def result_message(self, task):
        return task.result and task.result.get("message", "")

    def stacktrace(self, task):
        if not task.result:
            return
        stack = task.result.get("stack_trace")
        return format_html("<p>{}</p><pre>{}</pre>", task.result.get("message", ""), stack)


@admin_attr_decorator
class SourceVersionAdmin(admin.ModelAdmin):
    readonly_fields = ("created_at",)
    list_display = ("id", "data_source", "number", "created_at")
    list_filter = ("data_source",)


@admin_attr_decorator
class EntityAdmin(admin.ModelAdmin):
    def get_form(self, request, obj=None, **kwargs):
        # In the <select> for the entity type, we also want to indicate the account name
        form = super().get_form(request, obj, **kwargs)
        form.base_fields[
            "entity_type"
        ].label_from_instance = lambda entity: f"{entity.name} (Account: {entity.account.name})"
        return form

    readonly_fields = ("created_at",)
    list_display = (
        "id",
        "name",
        "account",
        "entity_type",
    )
    list_filter = ("entity_type",)
    raw_id_fields = ("attributes",)


@admin_attr_decorator
class JsonDataStoreAdmin(admin.ModelAdmin):
    raw_id_fields = ["account"]
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}


@admin_attr_decorator
class EntityTypeAdmin(admin.ModelAdmin):
    readonly_fields = ("created_at",)
    list_display = (
        "id",
        "name",
        "account",
    )


@admin_attr_decorator
class PlanningAdmin(admin.ModelAdmin):
    raw_id_fields = ("org_unit",)
    list_display = (
        "id",
        "name",
        "description",
        "project",
        "org_unit",
        # "forms",
        "team",
    )
    list_filter = ("project",)
    date_hierarchy = "started_at"

    fieldsets = [
        (
            None,
            {
                "fields": (
                    "name",
                    "description",
                    "project",
                    "forms",
                    "org_unit",
                    "team",
                    "started_at",
                    "ended_at",
                ),
            },
        ),
        (
            "update info",
            {
                "fields": (
                    "created_at",
                    "created_by",
                    "updated_at",
                    "deleted_at",
                )
            },
        ),
    ]
    readonly_fields = ("updated_at", "created_at")


@admin_attr_decorator
class TeamAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "description",
        "project",
        "type",
        "updated_at",
        "parent",
    )
    list_filter = ("project", "type")
    date_hierarchy = "created_at"
    readonly_fields = ("path",)


@admin_attr_decorator
class AssignmentAdmin(admin.ModelAdmin):
    raw_id_fields = ("org_unit",)
    list_display = (
        "id",
        "planning",
    )
    list_filter = ("planning",)
    date_hierarchy = "created_at"


class InstanceLockAdmin(admin.ModelAdmin):
    raw_id_fields = ("top_org_unit",)
    list_display = ("instance", "locked_by", "top_org_unit", "locked_at", "unlocked_by", "unlocked_at")
    date_hierarchy = "locked_at"


class StorageLogEntryInline(admin.TabularInline):
    model = StorageLogEntry
    raw_id_fields = ("instances", "org_unit")


class StorageDeviceAdmin(admin.ModelAdmin):
    fields = (
        "account",
        "customer_chosen_id",
        "type",
        "status",
        "status_reason",
        "status_comment",
        "status_updated_at",
        "org_unit",
        "entity",
        "created_at",
        "updated_at",
    )
    readonly_fields = ("created_at", "updated_at", "status_updated_at")
    list_display = ("account", "type", "customer_chosen_id")
    list_filter = ("account", "type", "status")
    raw_id_fields = ("org_unit",)
    inlines = [
        StorageLogEntryInline,
    ]


class StoragePasswordAdmin(admin.ModelAdmin):
    fields = (
        "password",
        "is_compromised",
        "project",
        "created_at",
        "updated_at",
    )
    readonly_fields = ("created_at", "updated_at")
    list_display = ("project", "password")
    list_filter = ("project", "is_compromised")


class WorkflowAdmin(admin.ModelAdmin):
    readonly_fields = ("created_at", "updated_at")

    def get_form(self, request, obj=None, **kwargs):
        # In the <select> for the entity type, we also want to indicate the account name
        form = super().get_form(request, obj, **kwargs)
        form.base_fields[
            "entity_type"
        ].label_from_instance = lambda entity: f"{entity.name} (Account: {entity.account.name})"
        return form

    def get_queryset(self, request):
        return Workflow.objects_include_deleted.all()


class WorkflowChangeInline(admin.TabularInline):
    model = WorkflowChange
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}


class WorkflowFollowupInline(admin.TabularInline):
    model = WorkflowFollowup
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}


class WorkflowVersionAdmin(admin.ModelAdmin):
    readonly_fields = ("created_at", "updated_at")
    inlines = [WorkflowChangeInline, WorkflowFollowupInline]

    def get_queryset(self, request):
        return WorkflowVersion.objects_include_deleted.all()


class AlgorithmRunAdmin(admin.ModelAdmin):
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}


class PageAdmin(admin.ModelAdmin):
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}


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
admin.site.register(AlgorithmRun, AlgorithmRunAdmin)
admin.site.register(FormVersion, FormVersionAdmin)
admin.site.register(FormPredefinedFilter, FormPredefinedFilterAdmin)
admin.site.register(FormAttachment, FormAttachmentAdmin)
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
admin.site.register(Page, PageAdmin)
admin.site.register(Task, TaskAdmin)
admin.site.register(EntityType, EntityTypeAdmin)
admin.site.register(JsonDataStore, JsonDataStoreAdmin)
admin.site.register(Entity, EntityAdmin)
admin.site.register(Team, TeamAdmin)
admin.site.register(Planning, PlanningAdmin)
admin.site.register(BulkCreateUserCsvFile)
admin.site.register(Assignment, AssignmentAdmin)
admin.site.register(InstanceLock, InstanceLockAdmin)
admin.site.register(StorageDevice, StorageDeviceAdmin)
admin.site.register(StoragePassword, StoragePasswordAdmin)
admin.site.register(Workflow, WorkflowAdmin)
admin.site.register(WorkflowVersion, WorkflowVersionAdmin)
admin.site.register(Report)
admin.site.register(ReportVersion)
