from django.contrib.admin import widgets
from django.contrib.gis import admin, forms
from django.contrib.gis.db import models as geomodels
from django.db import models

from iaso.admin.utils import (
    DuplicateUUIDFilter,
    IasoJSONEditorWidget,
    admin_attr_decorator,
    has_relation_filter_factory,
)
from iaso.models import Entity, Instance, InstanceFile, InstanceLock
from iaso.utils.gis import convert_2d_point_to_3d


class InstanceFileAdminInline(admin.TabularInline):
    model = InstanceFile
    extra = 0
    formfield_overrides = {
        models.TextField: {"widget": widgets.AdminTextInputWidget},
        models.JSONField: {"widget": IasoJSONEditorWidget},
    }


@admin.register(Instance)
@admin_attr_decorator
class InstanceAdmin(admin.GeoModelAdmin):
    raw_id_fields = (
        "org_unit",
        "entity",
        "form_version",
        "last_modified_by",
        "created_by",
    )
    search_fields = ("file_name", "uuid")
    list_display = (
        "id",
        "uuid",
        "project",
        "form",
        "org_unit",
        "period",
        "created_at",
        "entity",
        "deleted",
    )
    list_filter = (
        "project",
        "form",
        "deleted",
        DuplicateUUIDFilter,
        has_relation_filter_factory("Entity ID", "entity_id"),
    )
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
                    "general_validation_status",
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

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.prefetch_related(
            "org_unit__org_unit_type",
            "project",
            "form",
            "entity",
        )
        return queryset

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "entity":
            kwargs["queryset"] = (
                Entity.objects_include_deleted.all()
            )  # use the manager that includes soft-deleted objects
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(InstanceFile)
@admin_attr_decorator
class InstanceFileAdmin(admin.GeoModelAdmin):
    raw_id_fields = ("instance",)
    search_fields = ("name", "file")


@admin.register(InstanceLock)
class InstanceLockAdmin(admin.ModelAdmin):
    raw_id_fields = ("top_org_unit",)
    list_display = ("instance", "locked_by", "top_org_unit", "locked_at", "unlocked_by", "unlocked_at")
    date_hierarchy = "locked_at"
